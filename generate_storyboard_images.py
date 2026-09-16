"""
generate_storyboard_images.py

Generates one image per scene (37 by default) using fal.ai or Google Imagen,
based on scenes.json in the same folder.

SETUP (in VS Code terminal):
    pip install fal-client
    $env:FAL_KEY="your-fal-api-key-here"

For Gemini/Imagen:
    pip install google-genai
    $env:GEMINI_API_KEY="your-google-ai-studio-key-here"

RUN:
    python generate_storyboard_images.py
    python generate_storyboard_images.py --model fal-ai/flux/dev --scenes 1-5
    python generate_storyboard_images.py --style color

Output:
    ./output_images/scene_01.png ... scene_37.png
    ./output_images/manifest.json
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import fal_client
import requests

SCRIPT_DIR = Path(__file__).resolve().parent
SCENES_PATH = SCRIPT_DIR / "scenes.json"
OUTPUT_DIR = SCRIPT_DIR / "output_images"

CHARACTER = (
    "a single consistent original character, early-to-mid-30s, gender-neutral, "
    "hoodie over a button-down, expressive posture, same face and build in every image"
)

GEMINI_IMAGE_MODEL = "gemini-2.0-flash-preview-image-generation"

STYLES = {
    "storyboard": (
        "black and white rough pencil storyboard sketch, loose construction lines, "
        "gesture drawing, unfinished previs quality, readable silhouette, "
        "cinematic composition, no color, no shading, no texture"
    ),
    "color": (
        "cinematic animated illustration, soft painterly shading, "
        "consistent original art style, cinematic lighting, 16:9 composition"
    ),
}


def load_scenes(selection):
    with open(SCENES_PATH, "r", encoding="utf-8") as f:
        scenes = json.load(f)
    if not selection:
        return scenes["scenes"]
    ids = set()
    for part in selection.split(","):
        part = part.strip()
        if "-" in part:
            start, end = part.split("-")
            ids.update(range(int(start), int(end) + 1))
        else:
            ids.add(int(part))
    return [s for s in scenes["scenes"] if s["id"] in ids]


def build_prompt(scene, style):
    # Use keyIdea as the core narrative, animeScene for visual context
    return (
        f"Scene {scene['id']}: {scene['title']}. "
        f"{CHARACTER}. "
        f"Story context: {scene['keyIdea']}. "
        f"Visual reference: {scene['animeScene']}. "
        f"Style: {STYLES[style]}."
    )


def generate_fal_image(prompt, model):
    result = fal_client.subscribe(
        model,
        arguments={
            "prompt": prompt,
            "image_size": "landscape_16_9",
            "num_images": 1,
        },
        with_logs=False,
    )
    return result["images"][0]["url"]


def generate_gemini_image(prompt, model, dest):
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    response = client.models.generate_content(
        model=model,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_modalities=["TEXT", "IMAGE"],
            image_config=types.ImageConfig(aspect_ratio="16:9"),
        ),
    )
    for candidate in response.candidates or []:
        for part in candidate.content.parts or []:
            if part.inline_data and part.inline_data.data:
                dest.write_bytes(part.inline_data.data)
                return
    raise RuntimeError("Gemini returned no image data")


def download(url, dest):
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    dest.write_bytes(resp.content)


def main():
    parser = argparse.ArgumentParser(description="Generate storyboard images via fal.ai or Gemini Imagen")
    parser.add_argument("--provider", choices=("fal", "gemini"), default="fal")
    parser.add_argument("--model", default="fal-ai/flux/dev")
    parser.add_argument("--style", choices=STYLES.keys(), default="storyboard")
    parser.add_argument("--scenes", default=None)
    args = parser.parse_args()

    if args.provider == "fal" and not os.environ.get("FAL_KEY"):
        sys.exit("ERROR: set FAL_KEY in your environment before running this script.")
    if args.provider == "gemini" and not os.environ.get("GEMINI_API_KEY"):
        sys.exit("ERROR: set GEMINI_API_KEY in your environment before running this script.")

    if args.provider == "gemini" and args.model == "fal-ai/flux/dev":
        args.model = GEMINI_IMAGE_MODEL

    OUTPUT_DIR.mkdir(exist_ok=True)
    scenes = load_scenes(args.scenes)
    manifest = []

    for scene in scenes:
        prompt = build_prompt(scene, args.style)
        out_path = OUTPUT_DIR / f"scene_{scene['id']:02d}.png"
        print(f"[{scene['id']:02d}/37] Generating: {scene['title']}")
        try:
            if args.provider == "gemini":
                generate_gemini_image(prompt, args.model, out_path)
                url = None
            else:
                url = generate_fal_image(prompt, args.model)
                download(url, out_path)
            manifest.append({
                "id": scene["id"],
                "title": scene["title"],
                "prompt": prompt,
                "url": url,
                "file": out_path.name
            })
            print(f"   saved -> {out_path.name}")
        except Exception as e:
            print(f"   FAILED: {e}")
            manifest.append({
                "id": scene["id"],
                "title": scene["title"],
                "prompt": prompt,
                "error": str(e)
            })
        time.sleep(1)

    with open(OUTPUT_DIR / "manifest.json", "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\nDone. Images in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()

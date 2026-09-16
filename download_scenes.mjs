import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "public", "scenes");
const BASE_URL = "https://coresg-normal.trae.ai/api/ide/v1/text_to_image";
const SCENES_JSON_PATH = path.join(__dirname, "scenes.json");

const STYLE_MAP = {
  1: "cinematic anime illustration, purple dusk atmosphere, emotional loneliness, empty schoolyard, golden hour rim lighting, detailed character acting, 16:9 widescreen",
  2: "cinematic anime illustration, cool blue urban palette, invisible presence, muted city, soft rain, 16:9 widescreen",
  3: "cinematic anime illustration, massive wall dwarfing character, oppressive scale, charcoal rust palette, wind-swept cape, 16:9 widescreen",
  4: "cinematic anime illustration, soft color grading, school hallway reflections, glass mirrors, quiet guilt transformation, 16:9 widescreen",
  5: "cinematic anime illustration, reckless forward charge, dynamic diagonal lines, warm orange dust, 16:9 widescreen",
  6: "cinematic anime illustration, melancholic snowfall, depth through fog layers, sword on back, gentle forward movement, 16:9 widescreen",
  7: "cinematic anime illustration, red scarf flowing, dramatic protective pose, soft bloom lighting, emotional weight, 16:9 widescreen",
  8: "cinematic anime illustration, glowing aura training ground, sweat effort, orange sunset sky, realization mid-punch, 16:9 widescreen",
  9: "cinematic anime illustration, notebook sketches, green hair analytical pose, cause-and-effect diagrams glowing in air, 16:9 widescreen",
  10: "cinematic anime illustration, classroom observation, cold clinical composition, white uniform, watching from shadows, 16:9 widescreen",
  11: "cinematic anime illustration, yellow black hair, terrified shaking pose, lightning aura, clarity cutting through panic, forest, 16:9 widescreen",
  12: "cinematic anime illustration, hokage stone faces looming, teenage rebellion posture, sunset village rooftops, 16:9 widescreen",
  13: "cinematic anime illustration, pink spiky hair fire-user, clenched fist mid-leap, battle dust, dynamic shonen action, 16:9 widescreen",
  14: "cinematic anime illustration, green curly hair, flashback montage, notebook in hand, domino chain glowing, 16:9 widescreen",
  15: "cinematic anime illustration, dark jacketed sword god, cracked mirror reflection, identity crisis, dark stormy background, 16:9 widescreen",
  16: "cinematic anime illustration, reflection in water, ripples distorting self-image, twilight riverbank, 16:9 widescreen",
  17: "cinematic anime illustration, small crack spreading across massive structure, exponential collapse, frozen watching character, 16:9 widescreen",
  18: "cinematic anime illustration, hand stopping a falling domino mid-tumble, frozen time, cascade halted behind, spotlight, 16:9 widescreen",
  19: "cinematic anime illustration, split-screen ancient to modern, Greek amphora next to smartphone, recurring human gestures, 16:9 widescreen",
  20: "cinematic anime illustration, everyday moments montage, bedroom office cafe, same hesitation pose repeated, 16:9 widescreen",
  21: "cinematic anime illustration, character wearing conceptual lens glasses, world reframed into connected nodes lines, 16:9 widescreen",
  22: "cinematic anime illustration, sticky notes peeling off wall, actual pattern glowing beneath, surface vs root metaphor, 16:9 widescreen",
  23: "cinematic anime illustration, blueprint reveal, full domino chain diagram unrolling, system of arrows, 16:9 widescreen",
  24: "cinematic anime illustration, decisive hand smashing first domino, cascade frozen before it starts, impact frame, 16:9 widescreen",
  25: "cinematic anime illustration, door opening to new capability glow, character stepping through threshold, aura expanding, 16:9 widescreen",
  26: "cinematic anime illustration, snowball rolling downhill gaining size, positive change montage, growing smile, sunrise, 16:9 widescreen",
  27: "cinematic anime illustration, threshold between two worlds, old identity items on ground, packed bags, deep breath, 16:9 widescreen",
  28: "cinematic anime illustration, extracting poisoned root from soil, clean break source, tree above blooming instantly, 16:9 widescreen",
  29: "cinematic anime illustration, busy street, domino patterns highlighted around strangers, conscious smile, coffee shop commute, 16:9 widescreen",
  30: "cinematic anime illustration, split timeline diptych, left decay inaction, right what could be, horror in character eyes, 16:9 widescreen",
  31: "cinematic anime illustration, snowball of small wins into massive success boulder, riding forward confidently, dawn gold, 16:9 widescreen",
  32: "cinematic anime illustration, cosmic scale, galaxies trees stock markets relationships all domino chains, one universal principle, 16:9 widescreen",
  33: "cinematic anime illustration, before after portrait, left victim posture, right transformed, same face new identity, 16:9 widescreen",
  34: "cinematic anime illustration, four quadrants work love health learning, each pattern highlighted addressed, 16:9 widescreen",
  35: "cinematic anime illustration, return to childhood swing, now standing tall, same location new perspective, golden hour, 16:9 widescreen",
  36: "cinematic anime illustration, eye close-up new lens reflection, irises showing domino chain universe, dawn epiphany, 16:9 widescreen",
  37: "cinematic anime illustration, triumphant walk into sunrise, old clothes discarded behind, new silhouette, bridge burning metaphor, 16:9 widescreen",
};

const CHARACTER =
  "a single consistent original character, early-to-mid-30s, gender-neutral, hoodie over a button-down shirt, expressive body language, same recognizable face and build in every frame, emotionally honest performance";

function buildScenePrompt(sceneId, title, animeScene, keyIdea) {
  const style = STYLE_MAP[sceneId] || STYLE_MAP[1];
  return [
    `Scene ${sceneId} of 37. Title: ${title}.`,
    CHARACTER + ".",
    `Narrative principle: ${keyIdea}.`,
    `Visual reference: ${animeScene}.`,
    `Art direction: ${style}.`,
  ].join(" ");
}

function parseArgs(argv) {
  const only = new Set();
  let regenerate = false;
  let concurrency = 4;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--regenerate" || a === "-r") {
      regenerate = true;
    } else if (a === "--only" || a === "-o") {
      const list = argv[++i] || "";
      list
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n))
        .forEach((n) => only.add(n));
    } else if (a === "--concurrency" || a === "-j") {
      concurrency = Math.max(1, parseInt(argv[++i] || "4", 10));
    }
  }
  return { regenerate, only, concurrency };
}

async function downloadImage(url, dest, attempt = 1) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.promises.mkdir(path.dirname(dest), { recursive: true });
    await fs.promises.writeFile(dest, buf);
    return buf.length;
  } catch (err) {
    if (attempt < 3) {
      await new Promise((r) => setTimeout(r, 1200 * attempt));
      return downloadImage(url, dest, attempt + 1);
    }
    throw err;
  }
}

async function pMap(items, fn, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

async function main() {
  const { regenerate, only, concurrency } = parseArgs(process.argv);
  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  const raw = JSON.parse(await fs.promises.readFile(SCENES_JSON_PATH, "utf-8"));
  const scenes = raw.scenes || [];

  const queue = scenes
    .map((s) => s.id)
    .filter((id) => (only.size === 0 ? true : only.has(id)));

  console.log(`Downloading ${queue.length} scene images (concurrency=${concurrency})…`);
  console.log(`Output dir: ${OUT_DIR}\n`);

  let ok = 0;
  let failed = 0;

  await pMap(queue, async (id, idx) => {
    const entry = scenes.find((s) => s.id === id);
    if (!entry) return;
    const fileName = `scene_${String(id).padStart(2, "0")}.jpg`;
    const dest = path.join(OUT_DIR, fileName);
    const exists = fs.existsSync(dest);
    if (exists && !regenerate) {
      ok++;
      console.log(`  [${idx + 1}/${queue.length}] ${fileName} … cached, skip`);
      return;
    }
    const prompt = buildScenePrompt(entry.id, entry.title, entry.animeScene, entry.keyIdea);
    const url = `${BASE_URL}?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;
    try {
      const size = await downloadImage(url, dest);
      const kb = Math.round(size / 1024);
      ok++;
      console.log(`  [${idx + 1}/${queue.length}] ${fileName} … OK (${kb} KB)`);
    } catch (err) {
      failed++;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  [${idx + 1}/${queue.length}] ${fileName} … FAILED — ${msg}`);
    }
  }, concurrency);

  const total = fs.existsSync(OUT_DIR) ? fs.readdirSync(OUT_DIR).length : 0;
  console.log(`\nDone. Success=${ok}  Failed=${failed}  On-disk=${total} → ${OUT_DIR}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

# Domino Effect Series

A Remotion-based video project built around a 37-scene narrative sequence with voiceover, chapter-style transitions, ambient music, and animated storyboard presentation.

## Overview

This project renders a long-form storytelling video using:

- Remotion for composition and playback
- generated scene narration and captions
- ambient background music
- custom scene structure and timeline sequencing
- a full-series composition plus standalone scene compositions

## Project structure

- src/ — React + Remotion app source
- public/ — static media such as voiceover files and ambient audio
- scenes.json — narrative scene definitions
- generate-voiceover.mjs — generate voiceover and captions
- generate-audio-fallback.mjs — generate fallback audio placeholders
- generate_storyboard_images.py — storyboard image generation helper

## Run locally

Install dependencies:

```bash
npm install
```

Start the Remotion Studio preview:

```bash
npm run dev
```

Run the production bundle build:

```bash
npm run build
```

## Notes

- The active ambient track is stored in public/ambient/ambient-10m33.mp3.
- The voiceover script metadata lives in public/voiceover/script.json.
- The main full-series composition is defined in src/Composition.tsx and rendered through src/scenes/FullSeries.tsx.

## GitHub

Repository:

https://github.com/wisdomchiru9-png/domino-effect-series

## License

This project is currently unlicensed unless you add one explicitly in GitHub.

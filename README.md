# Domino Effect Series

A cinematic Remotion project that combines story-driven scene composition, ambient audio, and generated voiceover into a polished long-form video experience.

## Overview

The Domino Effect Series is a narrative video composition built with Remotion and React. It assembles a multi-scene timeline with:

- scripted narration and synchronized captions
- ambient background audio with dynamic volume control
- storyboard-style visual sequencing
- standalone scene and full-series compositions
- local preview and production rendering workflow

This project is designed for storytelling, presentation, and export-focused media production from a single codebase.

## Features

- Full-series timeline composition with chapter-like segmentation
- Scene metadata driven by JSON and script generation tools
- Ambient music support with scene-aware gain shaping
- Generated voiceover and subtitle assets for playback and distribution
- Remotion Studio preview for rapid iteration

## Tech stack

- Remotion
- React
- TypeScript
- Tailwind CSS
- FFmpeg-based media generation workflow

## Project structure

- src/ — React + Remotion source for compositions and scenes
- public/ — static audio, captions, and media assets
- scenes.json — narrative scene configuration
- generate-voiceover.mjs — voiceover and caption generation
- generate-audio-fallback.mjs — fallback audio generation
- generate_storyboard_images.py — storyboard asset creation helper
- output/ — rendered project outputs

## Run locally

Install dependencies:

```bash
npm install
```

Start the preview in Remotion Studio:

```bash
npm run dev
```

Create a production bundle:

```bash
npm run build
```

## Important media files

- Ambient track: public/ambient/ambient-10m33.mp3
- Voiceover script metadata: public/voiceover/script.json
- Main composition: src/Composition.tsx
- Full-series playback logic: src/scenes/FullSeries.tsx

## Repository

GitHub:
https://github.com/wisdomchiru9-png/domino-effect-series

## License

This project is licensed under the MIT License. See the LICENSE file for details.

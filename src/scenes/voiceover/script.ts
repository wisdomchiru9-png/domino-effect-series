import { staticFile } from "remotion";
import type { Caption } from "@remotion/captions";

export interface SceneNarration {
  id: number;
  title: string;
  narration: string;
  phase: number;
  tone: string;
}

export interface VoiceoverMeta {
  version: number;
  fps: number;
  wordsPerSecond: number;
  extraPaddingSeconds: number;
  characterWpm: number;
  ambient?: {
    path?: string;
    volume?: number;
  };
}

export interface VoiceoverScriptFile {
  meta: VoiceoverMeta;
  scenes: SceneNarration[];
  timing?: {
    fps: number;
    sceneDurations: Record<string, number>;
    sceneStarts?: Record<string, number>;
    sceneCaptions?: Record<string, Caption[]>;
  };
}

export interface SceneTiming {
  id: number;
  durationInFrames: number;
  durationInSeconds: number;
  captions: Caption[];
}

function wordsPerChar(wpm: number): number {
  const cpm = (wpm * 5) / 60;
  return 1 / cpm;
}

function estimateNarrationSeconds(text: string, meta: VoiceoverMeta): number {
  const chars = text.trim().length;
  return chars * wordsPerChar(meta.characterWpm) + meta.extraPaddingSeconds;
}

function tokenizeNarration(text: string, startSeconds: number, meta: VoiceoverMeta): Caption[] {
  const secPerChar = wordsPerChar(meta.characterWpm);
  const tokens: Array<{ word: string; spacesBefore: string }> = [];
  const re = /(\s*)([^\s]+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ spacesBefore: m[1] || "", word: m[2] });
  }

  const result: Caption[] = [];
  let t = startSeconds;
  for (const token of tokens) {
    const prefixDur = token.spacesBefore.length * secPerChar * 0.6;
    const wordDur = Math.max(0.08, token.word.length * secPerChar);
    const from = (t + prefixDur) * 1000;
    const to = (t + prefixDur + wordDur) * 1000;
    result.push({
      text: token.spacesBefore + token.word,
      startMs: Math.round(from),
      endMs: Math.round(to),
      timestampMs: Math.round(from),
      confidence: 1,
    });
    t += prefixDur + wordDur;
  }
  return result;
}

export function buildSceneTimingFromText(
  scene: SceneNarration,
  meta: VoiceoverMeta,
  frameStartSeconds = 0,
  durationOverrideSeconds?: number
): SceneTiming {
  const estimatedSeconds = estimateNarrationSeconds(scene.narration, meta);
  const seconds = durationOverrideSeconds ?? estimatedSeconds;
  if (durationOverrideSeconds === undefined) {
    return buildTextTiming(scene, meta, frameStartSeconds, seconds);
  }
  const scale = seconds / estimatedSeconds;
  const captions = tokenizeNarration(scene.narration, frameStartSeconds, meta).map((caption) => ({
    ...caption,
    startMs: Math.round(frameStartSeconds * 1000 + (caption.startMs - frameStartSeconds * 1000) * scale),
    endMs: Math.round(frameStartSeconds * 1000 + (caption.endMs - frameStartSeconds * 1000) * scale),
    timestampMs: Math.round(frameStartSeconds * 1000 + ((caption.timestampMs ?? caption.startMs) - frameStartSeconds * 1000) * scale),
  }));
  const fps = meta.fps;
  const durationInFrames = Math.max(150, Math.ceil(seconds * fps));
  return {
    id: scene.id,
    durationInFrames,
    durationInSeconds: seconds,
    captions,
  };
}

function buildTextTiming(
  scene: SceneNarration,
  meta: VoiceoverMeta,
  frameStartSeconds: number,
  seconds: number
): SceneTiming {
  const captions = tokenizeNarration(scene.narration, frameStartSeconds, meta);
  return {
    id: scene.id,
    durationInFrames: Math.max(150, Math.ceil(seconds * meta.fps)),
    durationInSeconds: seconds,
    captions,
  };
}

export async function loadVoiceoverScript(): Promise<VoiceoverScriptFile> {
  if (typeof window === "undefined") {
    const path = await import(/* webpackIgnore: true */ "node:path");
    const fs = await import(/* webpackIgnore: true */ "node:fs/promises");
    const file = await import(/* webpackIgnore: true */ "node:url");
    const __dirname = path.dirname(file.fileURLToPath(import.meta.url));
    const publicDir = path.resolve(__dirname, "..", "..", "public", "voiceover");
    const data = JSON.parse(
      await fs.readFile(path.join(publicDir, "script.json"), "utf-8")
    );
    let timing: VoiceoverScriptFile["timing"];
    try {
      timing = JSON.parse(
        await fs.readFile(path.join(publicDir, "timing.json"), "utf-8")
      ) as VoiceoverScriptFile["timing"];
    } catch {
      timing = undefined;
    }
    return { ...(data as VoiceoverScriptFile), timing };
  }
  try {
    const res = await fetch(staticFile("voiceover/script.json"));
    if (!res.ok) {
      throw new Error(`Failed to load voiceover script: ${res.status} ${res.statusText}`);
    }
    const data = (await res.json()) as VoiceoverScriptFile;
    try {
      const timingRes = await fetch(staticFile("voiceover/timing.json"));
      if (timingRes.ok) data.timing = await timingRes.json();
    } catch {
      // Use text estimates when the timing manifest is unavailable.
    }
    return data;
  } catch {
    const fallback: VoiceoverScriptFile = {
      meta: {
        version: 1,
        fps: 30,
        wordsPerSecond: 2.55,
        extraPaddingSeconds: 0.6,
        characterWpm: 153,
      },
      scenes: Array.from({ length: 37 }, (_, i) => ({
        id: i + 1,
        title: `Scene ${i + 1}`,
        narration: "",
        phase: i < 10 ? 1 : i < 20 ? 2 : i < 30 ? 3 : 4,
        tone: "neutral",
      })),
    };
    return fallback;
  }
}

export function sceneAudioFallbackPath(sceneId: number): string {
  return `voiceover/scene_${String(sceneId).padStart(2, "0")}.wav`;
}

export function ambientDefaultPath(): string {
  return `ambient/ambient-10m33.mp3`;
}

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  AbsoluteFill,
  Audio,
  CalculateMetadataFunction,
  Sequence,
  staticFile,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { Scene1 } from "./Scene1";
import { Scene37 } from "./Scene37";
import { SceneRenderer } from "./SceneRenderer";
import { OutroCard } from "./OutroCard";
import { PhaseIntro } from "./PhaseIntro";
import { BurnedCaptions } from "./voiceover/BurnedCaptions";
import {
  buildSceneTimingFromText,
  loadVoiceoverScript,
  sceneAudioFallbackPath,
  ambientDefaultPath,
  type SceneNarration,
  type VoiceoverMeta,
} from "./voiceover/script";

export interface FullSeriesProps {
  captionsEnabled?: boolean;
  voiceoverEnabled?: boolean;
  ambientEnabled?: boolean;
  ambientVolume?: number;
  voiceoverVolume?: number;
  [key: string]: unknown;
}

interface BuiltPlan {
  sceneDurations: Record<number, number>;
  sceneStartFrames: Record<number, number>;
  totalDuration: number;
  captions: Caption[];
  meta: VoiceoverMeta;
  scenes: SceneNarration[];
}

const FALLBACK_DURATION = 180;
const FALLBACK_TOTAL = 37 * FALLBACK_DURATION;

const INTRO_FRAMES = 0;
const OUTRO_FRAMES = 210;
const PHASE_INTRO_FRAMES = 150;
const PHASE_IDS = [11, 21, 31];
const TRANSITION_FRAMES = 14;

const buildPlan = (script: {
  meta: VoiceoverMeta;
  scenes: SceneNarration[];
  timing?: {
    fps: number;
    sceneDurations: Record<string, number>;
    sceneStarts?: Record<string, number>;
    sceneCaptions?: Record<string, Caption[]>;
  };
}): BuiltPlan => {
  const sceneDurations: Record<number, number> = {};
  const sceneStartFrames: Record<number, number> = {};
  const captions: Caption[] = [];
  let cursorFrames = 0;

  for (const scene of script.scenes) {
    const secStart = cursorFrames / script.meta.fps;
    const durationFrames = script.timing?.sceneDurations[String(scene.id)];
    const generatedCaptions = script.timing?.sceneCaptions?.[String(scene.id)];
    const t = generatedCaptions && durationFrames !== undefined
      ? {
          id: scene.id,
          durationInFrames: durationFrames,
          durationInSeconds: durationFrames / script.meta.fps,
          captions: generatedCaptions.map((caption) => ({
            ...caption,
            startMs: caption.startMs + secStart * 1000,
            endMs: caption.endMs + secStart * 1000,
            timestampMs: (caption.timestampMs ?? caption.startMs) + secStart * 1000,
          })),
        }
      : buildSceneTimingFromText(
          scene,
          script.meta,
          secStart,
          durationFrames === undefined ? undefined : durationFrames / script.meta.fps
        );
    sceneDurations[scene.id] = t.durationInFrames;
    sceneStartFrames[scene.id] = cursorFrames;
    captions.push(...t.captions);
    cursorFrames += t.durationInFrames;
  }

  return {
    sceneDurations,
    sceneStartFrames,
    totalDuration: cursorFrames,
    captions,
    meta: script.meta,
    scenes: script.scenes,
  };
};

function computeFullTimeline(plan: BuiltPlan | null, fallback: {
  sceneDurations: Record<number, number>;
  sceneStartFrames: Record<number, number>;
  total: number;
}) {
  const sceneDurations = plan?.sceneDurations ?? fallback.sceneDurations;
  const contentTotal = plan?.totalDuration ?? fallback.total;

  let cursor = INTRO_FRAMES;
  const finalSceneStart: Record<number, number> = {};
  const phaseIntroAt: Record<number, number> = {};

  for (let id = 1; id <= 37; id++) {
    if (PHASE_IDS.includes(id)) {
      const prev = id <= 11 ? 1 : id <= 21 ? 2 : 3;
      phaseIntroAt[prev + 1] = cursor;
      cursor += PHASE_INTRO_FRAMES;
    }
    finalSceneStart[id] = cursor;
    cursor += Math.max(TRANSITION_FRAMES * 2, (sceneDurations[id] ?? FALLBACK_DURATION));
  }

  const outroStart = cursor;
  cursor += OUTRO_FRAMES;

  return {
    sceneDurations,
    sceneStartFrames: finalSceneStart,
    contentTotal,
    outroStart,
    phaseIntroAt,
    total: cursor,
  };
}

export const fullSeriesCalculateMetadata: CalculateMetadataFunction<FullSeriesProps> =
  async () => {
    try {
      const script = await loadVoiceoverScript();
      const plan = buildPlan(script);
      const fallbackDurations = {
        sceneDurations: {} as Record<number, number>,
        sceneStartFrames: {} as Record<number, number>,
        total: FALLBACK_TOTAL,
      };
      let c = 0;
      for (let i = 1; i <= 37; i++) {
        fallbackDurations.sceneStartFrames[i] = c;
        fallbackDurations.sceneDurations[i] = FALLBACK_DURATION;
        c += FALLBACK_DURATION;
      }
      const timeline = computeFullTimeline(plan, fallbackDurations);
      return {
        durationInFrames: Math.max(FALLBACK_TOTAL, timeline.total),
      };
    } catch {
      const fallbackDurations = {
        sceneDurations: {} as Record<number, number>,
        sceneStartFrames: {} as Record<number, number>,
        total: FALLBACK_TOTAL,
      };
      let c = 0;
      for (let i = 1; i <= 37; i++) {
        fallbackDurations.sceneStartFrames[i] = c;
        fallbackDurations.sceneDurations[i] = FALLBACK_DURATION;
        c += FALLBACK_DURATION;
      }
      const timeline = computeFullTimeline(null, fallbackDurations);
      return { durationInFrames: timeline.total };
    }
  };

async function existsOnDisk(rel: string): Promise<boolean> {
  const path = await import(/* webpackIgnore: true */ "node:path");
  const fs = await import(/* webpackIgnore: true */ "node:fs/promises");
  const file = await import(/* webpackIgnore: true */ "node:url");
  const publicDir = path.resolve(path.dirname(file.fileURLToPath(import.meta.url)), "..", "..", "public");
  try { await fs.access(path.join(publicDir, rel)); return true; } catch { return false; }
}

export async function resolveAny(candidates: string[]): Promise<string | null> {
  if (typeof window === "undefined") {
    for (const rel of candidates) if (await existsOnDisk(rel)) return rel;
    return candidates[candidates.length - 1] ?? null;
  }
  for (const rel of candidates) {
    try {
      const res = await fetch(staticFile(rel), { method: "HEAD" });
      if (res.ok) return rel;
    } catch { /* try next */ }
  }
  return candidates[candidates.length - 1] ?? null;
}

async function resolveSceneAudio(sceneId: number): Promise<string | null> {
  return resolveAny([sceneAudioFallbackPath(sceneId)]);
}

async function resolveAmbient(metaPath?: string): Promise<string | null> {
  return resolveAny([
    ...(metaPath ? [metaPath] : []),
    ambientDefaultPath(),
  ]);
}

const TransitionedScene: React.FC<{
  from: number;
  duration: number;
  children: React.ReactNode;
}> = ({ from, duration, children }) => {
  return (
    <Sequence from={from} durationInFrames={duration}>
      <AbsoluteFill style={{ zIndex: 1 }}>{children}</AbsoluteFill>
    </Sequence>
  );
};

export const FullSeries: React.FC<FullSeriesProps> = ({
  captionsEnabled = false,
  voiceoverEnabled = true,
  ambientEnabled = true,
  ambientVolume = 0.75,
  voiceoverVolume = 0.95,
}) => {
  useVideoConfig();
  const { delayRender, continueRender, cancelRender } = useDelayRender();
  const [handle] = useState(() =>
    delayRender("voiceover-script", { timeoutInMilliseconds: 120000 })
  );
  const [plan, setPlan] = useState<BuiltPlan | null>(null);
  const [sceneAudioMap, setSceneAudioMap] = useState<Record<number, string | null>>({});
  const [ambientRel, setAmbientRel] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const script = await loadVoiceoverScript();
      const built = buildPlan(script);

      const audioMap: Record<number, string | null> = {};
      await Promise.all(
        script.scenes.map(async (scene) => {
          audioMap[scene.id] = await resolveSceneAudio(scene.id);
        })
      );

      const resolvedAmbient = await resolveAmbient(script.meta.ambient?.path);

      setSceneAudioMap(audioMap);
      setAmbientRel(resolvedAmbient);
      setPlan(built);
      continueRender(handle);
    } catch (e) {
      cancelRender(e instanceof Error ? e : new Error(String(e)));
    }
  }, [cancelRender, continueRender, handle]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const fallbackDurations = useMemo(() => {
    const d: Record<number, number> = {};
    const s: Record<number, number> = {};
    let c = 0;
    for (let i = 1; i <= 37; i++) {
      s[i] = c;
      d[i] = FALLBACK_DURATION;
      c += FALLBACK_DURATION;
    }
    return { sceneDurations: d, sceneStartFrames: s, total: c };
  }, []);

  const timeline = useMemo(
    () => computeFullTimeline(plan, fallbackDurations),
    [plan, fallbackDurations]
  );

  const sceneDurations = timeline.sceneDurations;
  const sceneStartFrames = timeline.sceneStartFrames;
  const totalDuration = timeline.total;
  const scenes = plan?.scenes ?? [];
  const fps = plan?.meta.fps ?? 30;

  const resolvedAmbientVolume =
    ((plan?.meta.ambient?.volume ?? 0.12) * ambientVolume);

  const ambientVolumeForFrame = (frame: number) => {
    if (!plan) return resolvedAmbientVolume;
    const scene = plan.scenes.find((item) => {
      const start = sceneStartFrames[item.id] ?? 0;
      const end = start + (sceneDurations[item.id] ?? FALLBACK_DURATION);
      return frame >= start && frame < end;
    });
    if (!scene) return resolvedAmbientVolume * 0.75;
    const phaseGain = scene.phase === 1 ? 0.78 : scene.phase === 2 ? 0.88 : scene.phase === 3 ? 1 : 0.92;
    return resolvedAmbientVolume * phaseGain;
  };

  const shiftedCaptions = useMemo(() => {
    const baseCaptions = plan?.captions ?? [];
    if (!plan) return baseCaptions;
    const introOffsetMs = (INTRO_FRAMES / fps) * 1000;
    return baseCaptions.map((c) => {
      const relSec = c.startMs / 1000;
      let sceneOffsetMs = 0;
      for (const s of plan.scenes) {
        const origStartSec = plan.sceneStartFrames[s.id] / fps;
        const durSec = plan.sceneDurations[s.id] / fps;
        if (relSec >= origStartSec && relSec < origStartSec + durSec) {
          const finalStartSec = (sceneStartFrames[s.id] ?? 0) / fps;
          sceneOffsetMs = (finalStartSec - origStartSec) * 1000;
          break;
        }
      }
      const totalShift = introOffsetMs + sceneOffsetMs;
      return {
        ...c,
        startMs: c.startMs + totalShift,
        endMs: c.endMs + totalShift,
        timestampMs: (c.timestampMs ?? c.startMs) + totalShift,
      };
    });
  }, [plan, fps, sceneStartFrames]);

  return (
    <AbsoluteFill>
      <Sequence durationInFrames={totalDuration}>
        <AbsoluteFill style={{ background: "#050312" }} />

        <TransitionedScene
          from={sceneStartFrames[1] - TRANSITION_FRAMES}
          duration={(sceneDurations[1] ?? FALLBACK_DURATION) + TRANSITION_FRAMES * 2}
        >
          <Scene1 />
        </TransitionedScene>

        <TransitionedScene
          from={sceneStartFrames[2] - TRANSITION_FRAMES}
          duration={(sceneDurations[2] ?? FALLBACK_DURATION) + TRANSITION_FRAMES * 2}
        >
          <SceneRenderer sceneId={2} />
        </TransitionedScene>

        {Array.from({ length: 34 }, (_, i) => {
          const sceneId = i + 3;
          const start = sceneStartFrames[sceneId] ?? 0;
          const dur = sceneDurations[sceneId] ?? FALLBACK_DURATION;
          return (
            <TransitionedScene
              key={`scene-wrap-${sceneId}`}
              from={start - TRANSITION_FRAMES}
              duration={dur + TRANSITION_FRAMES * 2}
            >
              <SceneRenderer sceneId={sceneId} />
            </TransitionedScene>
          );
        })}

        <TransitionedScene
          from={sceneStartFrames[37] - TRANSITION_FRAMES}
          duration={(sceneDurations[37] ?? FALLBACK_DURATION) + TRANSITION_FRAMES * 2}
        >
          <Scene37 />
        </TransitionedScene>

        {[1, 2, 3].map((p) => {
          const phaseId = p + 1;
          const at = timeline.phaseIntroAt[phaseId];
          if (at === undefined) return null;
          return (
            <TransitionedScene
              key={`phase-${p}`}
              from={at - TRANSITION_FRAMES}
              duration={PHASE_INTRO_FRAMES + TRANSITION_FRAMES * 2}
            >
              <PhaseIntro phase={phaseId as 1 | 2 | 3 | 4} />
            </TransitionedScene>
          );
        })}

        <TransitionedScene
          from={timeline.outroStart - TRANSITION_FRAMES}
          duration={OUTRO_FRAMES + TRANSITION_FRAMES * 2}
        >
          <OutroCard />
        </TransitionedScene>

        {voiceoverEnabled && scenes.length > 0
          ? scenes.map((scene) => {
              const start = sceneStartFrames[scene.id];
              const rel = sceneAudioMap[scene.id];
              if (!rel || start === undefined) return null;
              const dur = (sceneDurations[scene.id] ?? FALLBACK_DURATION) + TRANSITION_FRAMES;
              return (
                <Sequence
                  key={`vo-audio-${scene.id}`}
                  from={start}
                  durationInFrames={dur}
                >
                  <Audio
                    src={staticFile(rel)}
                    volume={voiceoverVolume}
                  />
                </Sequence>
              );
            })
          : null}

        {ambientEnabled && ambientRel ? (
          <Audio
            src={staticFile(ambientRel)}
            volume={ambientVolumeForFrame}
          />
        ) : null}

        {captionsEnabled && plan ? (
          <BurnedCaptions
            captions={shiftedCaptions}
            combineWithinMs={1400}
            position="lower-third"
            fontSize={44}
            fontWeight={800}
          />
        ) : null}
      </Sequence>
    </AbsoluteFill>
  );
};

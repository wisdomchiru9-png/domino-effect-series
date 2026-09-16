import { useEffect, useMemo, useState } from "react";
import {
  Audio,
  staticFile,
  useDelayRender,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { BurnedCaptions } from "./voiceover/BurnedCaptions";
import {
  buildSceneTimingFromText,
  loadVoiceoverScript,
  sceneAudioFallbackPath,
} from "./voiceover/script";
import { resolveAny } from "./FullSeries";

export interface SceneVoiceLayerProps {
  sceneId: number;
  showCaptions?: boolean;
  startFromMs?: number;
  captionAccent?: string;
}

export const SceneVoiceLayer: React.FC<SceneVoiceLayerProps> = ({
  sceneId,
  showCaptions = true,
  startFromMs = 0,
  captionAccent,
}) => {
  const { fps } = useVideoConfig();
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [ready, setReady] = useState(false);
  const { delayRender, continueRender } = useDelayRender();
  const [renderHandle] = useState(() => delayRender("scene-voice-layer"));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [resolved, script] = await Promise.all([
        resolveAny([sceneAudioFallbackPath(sceneId)]),
        loadVoiceoverScript(),
      ]);

      let caps: Caption[] = [];
      const scene = script.scenes.find((s) => s.id === sceneId);
      if (scene) {
        const durationFrames = script.timing?.sceneDurations[String(scene.id)];
        caps = script.timing?.sceneCaptions?.[String(scene.id)] ?? buildSceneTimingFromText(
          scene,
          script.meta,
          0,
          durationFrames === undefined ? undefined : durationFrames / script.meta.fps
        ).captions;
      }

      if (cancelled) return;
      setAudioSrc(resolved);
      setCaptions(caps);
      setReady(true);
      continueRender(renderHandle);
    })();
    return () => {
      cancelled = true;
    };
  }, [sceneId, fps, continueRender, renderHandle]);

  const shiftedCaptions = useMemo(
    () =>
      captions.map((c) => ({
        ...c,
        startMs: c.startMs + startFromMs,
        endMs: c.endMs + startFromMs,
        timestampMs: (c.timestampMs ?? c.startMs) + startFromMs,
      })),
    [captions, startFromMs]
  );

  const startFromFrames = Math.round((startFromMs / 1000) * fps);

  if (!ready) return null;
  return (
    <>
      {audioSrc ? (
        <Audio src={staticFile(audioSrc)} startFrom={startFromFrames} />
      ) : null}
      {showCaptions && shiftedCaptions.length > 0 ? (
        <BurnedCaptions
          captions={shiftedCaptions}
          combineWithinMs={1400}
          position="lower-third"
          accent={captionAccent}
        />
      ) : null}
    </>
  );
};

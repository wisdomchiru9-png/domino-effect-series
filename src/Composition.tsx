import { CalculateMetadataFunction, Composition, staticFile } from "remotion";
import { Scene1 } from "./scenes/Scene1";
import { Scene37 } from "./scenes/Scene37";
import { SceneRenderer } from "./scenes/SceneRenderer";
import { FullSeries, fullSeriesCalculateMetadata } from "./scenes/FullSeries";
import { IntroTitle } from "./scenes/IntroTitle";
import { OutroCard } from "./scenes/OutroCard";
import { PhaseIntro } from "./scenes/PhaseIntro";
import {
  buildSceneTimingFromText,
  loadVoiceoverScript,
  type SceneNarration,
} from "./scenes/voiceover/script";

type Props = {};

const calculateMetadata: CalculateMetadataFunction<Props> = () => {
  return {};
};

export const sceneDurationFor = async (sceneId: number): Promise<number> => {
  try {
    const script = await loadVoiceoverScript();
    const scene = (script.scenes as SceneNarration[]).find((s) => s.id === sceneId);
    if (!scene) return 180;
    const durationFrames = script.timing?.sceneDurations[String(scene.id)];
    return buildSceneTimingFromText(
      scene,
      script.meta,
      0,
      durationFrames === undefined ? undefined : durationFrames / script.meta.fps
    ).durationInFrames;
  } catch {
    return 180;
  }
};

export const MyComposition = () => {
  return (
    <>
      <Composition
        id="FullSeries"
        component={FullSeries}
        durationInFrames={37 * 180 + 150 * 3 + 210}
        fps={30}
        width={1280}
        height={720}
        calculateMetadata={fullSeriesCalculateMetadata}
        defaultProps={{
          captionsEnabled: false,
          voiceoverEnabled: true,
          ambientEnabled: true,
          ambientVolume: 0.75,
          voiceoverVolume: 0.95,
        }}
      />

      <Composition
        id="IntroTitle"
        component={IntroTitle}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
      />

      <Composition
        id="OutroCard"
        component={OutroCard}
        durationInFrames={210}
        fps={30}
        width={1280}
        height={720}
      />

      {[1, 2, 3, 4].map((p) => (
        <Composition
          key={`phase-${p}`}
          id={`Phase0${p}`}
          component={() => <PhaseIntro phase={p as 1 | 2 | 3 | 4} />}
          durationInFrames={150}
          fps={30}
          width={1280}
          height={720}
        />
      ))}

      <Composition
        id="Scene1"
        component={Scene1}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        calculateMetadata={async () => ({
          durationInFrames: await sceneDurationFor(1),
        })}
        defaultProps={{
          standaloneAudioAndCaptions: true,
          _audioHint: staticFile("voiceover/scene_01.wav"),
        }}
      />

      <Composition
        id="Scene2"
        component={() => <SceneRenderer sceneId={2} standaloneAudioAndCaptions />}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        calculateMetadata={async () => ({
          durationInFrames: await sceneDurationFor(2),
        })}
      />

      {Array.from({ length: 34 }, (_, i) => {
        const sceneId = i + 3;
        return (
          <Composition
            key={`Scene${sceneId}`}
            id={`Scene${sceneId}`}
            component={() => <SceneRenderer sceneId={sceneId} standaloneAudioAndCaptions />}
            durationInFrames={180}
            fps={30}
            width={1280}
            height={720}
            calculateMetadata={async () => ({
              durationInFrames: await sceneDurationFor(sceneId),
            })}
          />
        );
      })}

      <Composition
        id="Scene37"
        component={Scene37}
        durationInFrames={180}
        fps={30}
        width={1280}
        height={720}
        calculateMetadata={async () => ({
          durationInFrames: await sceneDurationFor(37),
        })}
        defaultProps={{
          standaloneAudioAndCaptions: true,
        }}
      />
    </>
  );
};

export { calculateMetadata };

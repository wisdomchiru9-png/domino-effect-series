import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { StoryboardImage } from "./StoryboardImage";
import { SceneVoiceLayer } from "./SceneVoiceLayer";

export interface Scene1Props {
  standaloneAudioAndCaptions?: boolean;
}

export const Scene1: React.FC<Scene1Props> = ({ standaloneAudioAndCaptions = false }) => {
  const frame = useCurrentFrame();
  const intro = interpolate(frame, [0, 40, 90], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <StoryboardImage sceneId={1} intensity={0.9} preset="zoomInRight" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(134, 115, 255, 0.05) 0%, rgba(26, 30, 49, 0.08) 40%, rgba(4,6,12,0.28) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: "7%",
          top: "12%",
          opacity: 0.95,
          transform: `translateY(${(1 - intro) * 28}px)`,
          padding: "10px 18px",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 900,
            color: "#f4f7ff",
            lineHeight: 1,
            letterSpacing: "-0.06em",
            textShadow: "0 4px 22px rgba(0,0,0,0.85)",
          }}
        >
          The Hidden Reason
        </div>
        <div
          style={{
            marginTop: 8,
            fontSize: 30,
            fontWeight: 600,
            color: "#dfe9ff",
            letterSpacing: "0.04em",
            opacity: 0.92,
            textShadow: "0 3px 16px rgba(0,0,0,0.85)",
          }}
        >
          You&apos;re Stuck
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: "6%",
          bottom: "11%",
          width: 340,
          color: "#dfeaff",
          fontSize: 20,
          lineHeight: 1.5,
          opacity: 0.9,
          transform: `translateY(${(1 - intro) * 18}px)`,
          textShadow: "0 3px 16px rgba(0,0,0,0.88)",
          textAlign: "right",
        }}
      >
        The real problem is not effort itself.
        <br />
        It is the hidden cause behind the effort.
      </div>

      {standaloneAudioAndCaptions ? (
        <SceneVoiceLayer sceneId={1} />
      ) : null}
    </AbsoluteFill>
  );
};

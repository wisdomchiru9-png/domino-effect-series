import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { StoryboardImage } from "./StoryboardImage";
import { SceneVoiceLayer } from "./SceneVoiceLayer";

export interface Scene37Props {
  standaloneAudioAndCaptions?: boolean;
}

export const Scene37: React.FC<Scene37Props> = ({ standaloneAudioAndCaptions = false }) => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 40, 160], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = interpolate(frame, [0, 40], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const messageOpacity = interpolate(frame, [50, 80, 160], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const messageY = interpolate(frame, [50, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <StoryboardImage sceneId={37} intensity={1} preset="zoomInRight" />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(220, 170, 255, 0.02) 0%, rgba(120, 80, 200, 0.02) 40%, rgba(60, 30, 120, 0.10) 70%, rgba(6, 3, 18, 0.28) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          paddingTop: "9%",
          paddingLeft: "5%",
          paddingRight: "5%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          gap: 22,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            textAlign: "center",
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            transformOrigin: "center top",
          }}
        >
          <h1
            style={{
              fontSize: "58px",
              fontWeight: 800,
              color: "#f0c5ff",
              margin: 0,
              letterSpacing: "-1px",
              lineHeight: 1.08,
              textShadow: "0 4px 24px rgba(0,0,0,0.88)",
            }}
          >
            The Point of No Return
          </h1>
        </div>

        <div
          style={{
            textAlign: "center",
            maxWidth: 900,
            opacity: messageOpacity,
            transform: `translateY(${messageY}px)`,
          }}
        >
          <p
            style={{
              fontSize: "30px",
              fontWeight: 500,
              color: "#e4c8ff",
              margin: 0,
              lineHeight: 1.45,
              textShadow: "0 3px 18px rgba(0,0,0,0.88)",
            }}
          >
            The real shift is not in a single moment—it is in the moment you stop going back.
          </p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          textAlign: "center",
          maxWidth: 820,
          paddingLeft: "4%",
          paddingRight: "4%",
          opacity: interpolate(frame, [110, 145, 180], [0, 1, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p
          style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "#f0d8ff",
            margin: 0,
            fontStyle: "italic",
            lineHeight: 1.4,
            textShadow: "0 3px 18px rgba(0,0,0,0.9)",
          }}
        >
          Once you commit, the old path becomes impossible.
        </p>
      </div>

      {standaloneAudioAndCaptions ? (
        <SceneVoiceLayer sceneId={37} />
      ) : null}
    </AbsoluteFill>
  );
};

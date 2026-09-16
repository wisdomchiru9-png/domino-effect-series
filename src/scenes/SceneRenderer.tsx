import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { sceneMap } from "./sceneMap";
import { StoryboardImage } from "./StoryboardImage";
import { SceneVoiceLayer } from "./SceneVoiceLayer";

interface SceneRendererProps {
  sceneId: number;
  standaloneAudioAndCaptions?: boolean;
}

const PHASE_PALETTES: Record<number, {
  titleColor: string;
  textColor: string;
  accent: string;
  chipBg: string;
  chipBorder: string;
  sceneLabelColor: string;
  overlay: string;
  decoration: "dominos" | "wave" | "geometric" | "rise";
}> = {
  1: {
    titleColor: "#f6efff",
    textColor: "#e4d7ff",
    accent: "#d4a5ff",
    chipBg: "rgba(34,18,70,0.42)",
    chipBorder: "rgba(196,160,255,0.25)",
    sceneLabelColor: "#cdb6ff",
    overlay: "linear-gradient(180deg, rgba(30,18,70,0.22) 0%, rgba(10,6,28,0.08) 32%, rgba(6,3,20,0.55) 100%)",
    decoration: "dominos",
  },
  2: {
    titleColor: "#f2f7ff",
    textColor: "#dce9ff",
    accent: "#a5ccff",
    chipBg: "rgba(12,30,70,0.42)",
    chipBorder: "rgba(160,200,255,0.25)",
    sceneLabelColor: "#b9d3ff",
    overlay: "linear-gradient(180deg, rgba(10,24,58,0.22) 0%, rgba(5,12,30,0.08) 32%, rgba(3,8,22,0.55) 100%)",
    decoration: "wave",
  },
  3: {
    titleColor: "#f3fffa",
    textColor: "#d9ffe9",
    accent: "#a5ffd4",
    chipBg: "rgba(10,50,40,0.42)",
    chipBorder: "rgba(150,255,200,0.25)",
    sceneLabelColor: "#baf5d8",
    overlay: "linear-gradient(180deg, rgba(10,40,34,0.22) 0%, rgba(4,18,14,0.08) 32%, rgba(2,10,8,0.55) 100%)",
    decoration: "geometric",
  },
  4: {
    titleColor: "#fff6e6",
    textColor: "#ffe7c2",
    accent: "#ffd6a5",
    chipBg: "rgba(60,38,10,0.42)",
    chipBorder: "rgba(255,205,150,0.25)",
    sceneLabelColor: "#f3cfa0",
    overlay: "linear-gradient(180deg, rgba(54,32,10,0.22) 0%, rgba(26,14,4,0.08) 32%, rgba(12,6,2,0.55) 100%)",
    decoration: "rise",
  },
};

function phaseOf(id: number) {
  return id <= 10 ? 1 : id <= 20 ? 2 : id <= 30 ? 3 : 4;
}

function layoutVariant(id: number): "left-heavy" | "right-heavy" | "centered-strong" | "balanced" {
  const i = id % 4;
  if (i === 0) return "left-heavy";
  if (i === 1) return "right-heavy";
  if (i === 2) return "centered-strong";
  return "balanced";
}

export const SceneRenderer: React.FC<SceneRendererProps> = ({ sceneId, standaloneAudioAndCaptions = false }) => {
  const frame = useCurrentFrame();
  const scene = sceneMap[sceneId - 1];
  const phase = phaseOf(sceneId);
  const palette = PHASE_PALETTES[phase];
  const layout = layoutVariant(sceneId);

  if (!scene) {
    return (
      <AbsoluteFill style={{ background: "#000", color: "#fff", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <p>Scene {sceneId} not found</p>
      </AbsoluteFill>
    );
  }

  const titleOpacity = interpolate(frame, [0, 34, 160], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [0, 34], [0.82, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  const titleY = interpolate(frame, [0, 34], [18, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const messageOpacity = interpolate(frame, [46, 78, 160], [0, 1, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const messageY = interpolate(frame, [46, 78], [22, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleSize = scene.title.length > 32 ? 50 : scene.title.length > 22 ? 56 : 62;
  const keySize = scene.keyIdea.length > 120 ? 22 : 26;

  const titleBox: React.CSSProperties =
    layout === "left-heavy"
      ? { top: "8%", left: "5%", width: "52%", alignItems: "flex-start", textAlign: "left" }
      : layout === "right-heavy"
        ? { top: "10%", right: "5%", width: "50%", alignItems: "flex-end", textAlign: "right" }
        : layout === "centered-strong"
          ? { top: "10%", left: "12%", right: "12%", alignItems: "center", textAlign: "center" }
          : { top: "9%", left: "6%", right: "6%", alignItems: "flex-start", textAlign: "left" };

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <StoryboardImage sceneId={sceneId} intensity={0.92} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: palette.overlay,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          ...titleBox,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
            transformOrigin: layout === "right-heavy" ? "right top" : layout === "centered-strong" ? "center top" : "left top",
            maxWidth: "100%",
            padding: "8px 0",
          }}
        >
          <h1
            style={{
              fontSize: titleSize,
              fontWeight: 800,
              color: palette.titleColor,
              margin: 0,
              letterSpacing: "-0.03em",
              lineHeight: 1.02,
              textShadow: `0 3px 18px rgba(0,0,0,0.82), 0 0 30px ${palette.accent}33`,
            }}
          >
            {scene.title}
          </h1>
        </div>

        <div
          style={{
            textAlign: layout === "right-heavy" ? "right" : layout === "centered-strong" ? "center" : "left",
            maxWidth: "100%",
            opacity: messageOpacity,
            transform: `translateY(${messageY}px)`,
            padding: "10px 0",
          }}
        >
          <p
            style={{
              fontSize: keySize,
              fontWeight: 500,
              color: palette.textColor,
              margin: 0,
              lineHeight: 1.35,
              textShadow: "0 2px 16px rgba(0,0,0,0.82)",
            }}
          >
            {scene.keyIdea}
          </p>
        </div>
      </div>

      {standaloneAudioAndCaptions ? (
        <SceneVoiceLayer sceneId={sceneId} />
      ) : null}
    </AbsoluteFill>
  );
};

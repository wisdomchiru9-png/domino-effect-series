import { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface DominoProgressProps {
  sceneStartFrames: Record<number, number>;
  sceneDurations: Record<number, number>;
  totalFrames: number;
  introFrames?: number;
  outroFrames?: number;
  phaseIntroFrames?: Record<number, number>;
  totalWithExtras: number;
}

const phaseOf = (id: number): 1 | 2 | 3 | 4 =>
  id <= 10 ? 1 : id <= 20 ? 2 : id <= 30 ? 3 : 4;

const PHASE_COLORS: Record<number, string> = {
  1: "#d4a5ff",
  2: "#a5ccff",
  3: "#a5ffd4",
  4: "#ffd6a5",
};

export const DominoProgress: React.FC<DominoProgressProps> = ({
  sceneStartFrames,
  sceneDurations,
  totalFrames,
  totalWithExtras,
}) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();

  const ordered = useMemo(() => {
    const ids = Object.keys(sceneDurations)
      .map((k) => parseInt(k, 10))
      .sort((a, b) => a - b);
    return ids.map((id) => ({
      id,
      start: sceneStartFrames[id] ?? 0,
      dur: sceneDurations[id] ?? 180,
    }));
  }, [sceneDurations, sceneStartFrames]);

  const progress = Math.max(0, Math.min(1, frame / Math.max(1, totalWithExtras)));
  const contentProgress = Math.max(
    0,
    Math.min(1, frame / Math.max(1, totalFrames))
  );

  const barWidth = width * 0.74;
  const leftX = (width - barWidth) / 2;
  const y = 44;

  const fallenCount = Math.min(
    ordered.length,
    ordered.findIndex(
      (s) => s.start + s.dur > Math.min(frame, totalFrames)
    ) === -1
      ? ordered.length
      : ordered.findIndex(
          (s) => s.start + s.dur > Math.min(frame, totalFrames)
        )
  );

  return (
    <AbsoluteFill
      style={{
        pointerEvents: "none",
        zIndex: 45,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: leftX,
          top: y,
          width: barWidth,
          height: 4,
          borderRadius: 999,
          background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${progress * 100}%`,
            background:
              "linear-gradient(90deg, #d4a5ff 0%, #a5ccff 35%, #a5ffd4 65%, #ffd6a5 100%)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          left: leftX,
          top: y + 14,
          width: barWidth,
          height: 18,
          display: "flex",
          alignItems: "center",
        }}
      >
        {ordered.map((s, i) => {
          const color = PHASE_COLORS[phaseOf(s.id)];
          const isFallen = i < fallenCount;
          const localT = contentProgress * totalFrames >= s.start
            ? Math.min(1, (contentProgress * totalFrames - s.start) / Math.max(1, s.dur))
            : 0;
          const tilt = isFallen ? -72 : interpolate(localT, [0, 1], [0, -60], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={`dot-${s.id}`}
              style={{
                flex: `0 0 auto`,
                width: barWidth / ordered.length - 2,
                height: 10,
                marginRight: 2,
                borderRadius: 2,
                background: isFallen
                  ? color
                  : "rgba(255,255,255,0.07)",
                transform: `rotate(${tilt}deg)`,
                transformOrigin: "bottom left",
                boxShadow: isFallen ? `0 0 8px ${color}88` : "none",
                opacity: isFallen ? 1 : 0.9,
              }}
            />
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: leftX,
          top: y - 22,
          fontSize: 11,
          letterSpacing: "0.2em",
          fontWeight: 700,
          color: "rgba(220,210,255,0.55)",
          textTransform: "uppercase",
        }}
      >
        {Math.round(progress * 100)}% · Scene {Math.min(37, Math.max(1, fallenCount || 1))}/37
      </div>

      {[1, 2, 3, 4].map((p) => {
        const phaseEndId = p * 10 - (p === 4 ? 3 : 0);
        const startId = (p - 1) * 10 + 1;
        const sStart =
          sceneStartFrames[startId as 1] ??
          (startId - 1) * 180;
        const sEnd =
          (sceneStartFrames[phaseEndId as 1] ?? (phaseEndId - 1) * 180) +
          (sceneDurations[phaseEndId as 1] ?? 180);
        const xStart =
          leftX +
          (sStart / Math.max(1, totalFrames)) * barWidth;
        const xEnd =
          leftX +
          (sEnd / Math.max(1, totalFrames)) * barWidth;
        return (
          <div
            key={`phase-label-${p}`}
            style={{
              position: "absolute",
              left: xStart,
              top: y + 38,
              width: Math.max(20, xEnd - xStart),
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.18em",
              color: `${PHASE_COLORS[p]}aa`,
              textTransform: "uppercase",
              textAlign: "center",
              transform: "translateX(0)",
            }}
          >
            {["Awakening", "Understanding", "Intervention", "Mastery"][p - 1]}
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export interface PhaseIntroProps {
  phase: 1 | 2 | 3 | 4;
}

const PHASE_STYLES: Record<number, {
  bg: string;
  titleColor: string;
  subtitle: string;
  headline: string;
  accent: string;
  glow: string;
  numColor: string;
}> = {
  1: {
    bg: "radial-gradient(ellipse at 50% 45%, #3a2168 0%, #1c0f42 50%, #07031a 100%)",
    titleColor: "#e7d8ff",
    subtitle: "Awakening",
    headline: "First, You Have to See It.",
    accent: "d4a5ff",
    glow: "rgba(180,130,255,0.45)",
    numColor: "rgba(180,130,255,0.22)",
  },
  2: {
    bg: "radial-gradient(ellipse at 50% 45%, #1a2e5e 0%, #0f1e40 50%, #03081a 100%)",
    titleColor: "#d6e8ff",
    subtitle: "Understanding",
    headline: "Now Trace The Chain Backward.",
    accent: "a5ccff",
    glow: "rgba(130,170,255,0.45)",
    numColor: "rgba(130,170,255,0.22)",
  },
  3: {
    bg: "radial-gradient(ellipse at 50% 45%, #144a3c 0%, #0a2e26 50%, #031a15 100%)",
    titleColor: "#d0ffe4",
    subtitle: "Intervention",
    headline: "Then Break The Right Domino.",
    accent: "a5ffd4",
    glow: "rgba(130,255,200,0.4)",
    numColor: "rgba(130,255,200,0.22)",
  },
  4: {
    bg: "radial-gradient(ellipse at 50% 45%, #5a3a10 0%, #3a2408 50%, #1a0e02 100%)",
    titleColor: "#ffeccb",
    subtitle: "Mastery",
    headline: "Finally, The New Cascade Is Yours.",
    accent: "ffd6a5",
    glow: "rgba(255,200,130,0.45)",
    numColor: "rgba(255,200,130,0.22)",
  },
};

export const PhaseIntro: React.FC<PhaseIntroProps> = ({ phase }) => {
  const frame = useCurrentFrame();
  const style = PHASE_STYLES[phase];

  const bgIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const numScale = interpolate(frame, [8, 40], [2.2, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.6)),
  });
  const numOpacity = interpolate(frame, [8, 32], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const subY = interpolate(frame, [38, 62], [28, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subOpacity = interpolate(frame, [38, 62], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headOpacity = interpolate(frame, [68, 98], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const headScale = interpolate(frame, [68, 98], [0.88, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  const barOpacity = interpolate(frame, [105, 130], [0, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dots = phase;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: style.bg, opacity: bgIn }} />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 1200,
          height: 1200,
          background: `radial-gradient(circle, ${style.glow} 0%, transparent 65%)`,
          opacity: numOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          right: "8%",
          top: "8%",
          fontSize: 320,
          fontWeight: 900,
          letterSpacing: "-0.08em",
          color: style.numColor,
          transform: `scale(${numScale})`,
          transformOrigin: "top right",
          opacity: numOpacity,
          lineHeight: 1,
        }}
      >
        {String(phase).padStart(2, "0")}
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingLeft: "10%",
          paddingRight: "10%",
          gap: 26,
        }}
      >
        <div
          style={{
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 6,
            }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 3,
                  background:
                    i < dots
                      ? `#${style.accent}`
                      : "rgba(255,255,255,0.1)",
                  boxShadow:
                    i < dots ? `0 0 16px #${style.accent}aa` : "none",
                }}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 20,
              color: `#${style.accent}`,
              letterSpacing: "0.45em",
              textTransform: "uppercase",
              fontWeight: 700,
            }}
          >
            Phase {String(phase).padStart(2, "0")} · {style.subtitle}
          </div>
        </div>

        <div
          style={{
            opacity: headOpacity,
            transform: `scale(${headScale})`,
            transformOrigin: "left center",
          }}
        >
          <div
            style={{
              fontSize: 84,
              fontWeight: 800,
              color: style.titleColor,
              letterSpacing: "-0.04em",
              lineHeight: 1,
              textShadow: `0 0 40px ${style.glow}`,
              maxWidth: 960,
            }}
          >
            {style.headline}
          </div>
        </div>

        <div
          style={{
            opacity: barOpacity,
            width: 160,
            height: 3,
            background: `linear-gradient(90deg, #${style.accent}, transparent)`,
            borderRadius: 999,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

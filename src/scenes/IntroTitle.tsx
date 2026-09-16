import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const IntroTitle: React.FC = () => {
  const frame = useCurrentFrame();

  const bgIn = interpolate(frame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const subtitleY = interpolate(frame, [40, 70], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = interpolate(frame, [22, 52], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [22, 52], [0.7, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.3)),
  });
  const taglineOpacity = interpolate(frame, [85, 115], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const accentOpacity = interpolate(frame, [110, 140], [0, 0.9], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const dominoFall = (i: number) =>
    interpolate(
      frame,
      [110 + i * 4, 110 + i * 4 + 14],
      [0, -1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.in(Easing.quad),
      }
    );

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, #381f6e 0%, #1c1042 45%, #08051a 100%)",
          opacity: bgIn,
        }}
      />

      {[...Array(8)].map((_, i) => {
        const xPct = 12 + i * 10.5;
        const fall = dominoFall(i);
        return (
          <div
            key={`dom-${i}`}
            style={{
              position: "absolute",
              bottom: "22%",
              left: `${xPct}%`,
              width: 22,
              height: 86,
              transform: `rotate(${fall * 72}deg) translateY(${fall * -10}px)`,
              transformOrigin: "bottom center",
              background:
                "linear-gradient(180deg, #f7efff 0%, #d9c6ff 50%, #a285e6 100%)",
              borderRadius: 4,
              boxShadow:
                "0 6px 18px rgba(160,120,255,0.35), inset 0 0 8px rgba(255,255,255,0.3)",
              opacity: accentOpacity * 0.95,
            }}
          />
        );
      })}

      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: "18%",
          height: 1,
          background:
            "linear-gradient(90deg, transparent, rgba(182,146,255,0.6), transparent)",
          opacity: accentOpacity,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          paddingBottom: "8%",
        }}
      >
        <div
          style={{
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            letterSpacing: "0.58em",
            textTransform: "uppercase",
            color: "#c7b8ff",
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          A 37-Chapter Visual Essay
        </div>

        <div
          style={{
            opacity: titleOpacity,
            transform: `scale(${titleScale})`,
            transformOrigin: "center center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: "#f6f1ff",
              textShadow:
                "0 0 30px rgba(186,140,255,0.55), 0 0 80px rgba(120,70,220,0.35)",
            }}
          >
            The Domino
          </div>
          <div
            style={{
              fontSize: 108,
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
              color: "transparent",
              background:
                "linear-gradient(135deg, #e0cbff 0%, #a98bff 50%, #6c4fd6 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 50px rgba(180,130,255,0.25)",
            }}
          >
            Effect Series
          </div>
        </div>

        <div
          style={{
            opacity: taglineOpacity,
            marginTop: 10,
            maxWidth: 820,
            textAlign: "center",
            fontSize: 28,
            fontWeight: 500,
            color: "#d8c9ff",
            lineHeight: 1.4,
          }}
        >
          See the chain. Break the pattern. Rewrite the cascade.
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "8%",
          top: "9%",
          padding: "8px 16px",
          borderRadius: 999,
          border: "1px solid rgba(186,146,255,0.4)",
          background: "rgba(24,14,58,0.35)",
          backdropFilter: "blur(4px)",
          color: "#cdbbff",
          fontSize: 14,
          letterSpacing: "0.2em",
          opacity: subtitleOpacity,
        }}
      >
        INTRO
      </div>
    </AbsoluteFill>
  );
};

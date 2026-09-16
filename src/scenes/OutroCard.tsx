import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

export const OutroCard: React.FC = () => {
  const frame = useCurrentFrame();

  const bgIn = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.ease),
  });
  const titleY = interpolate(frame, [18, 50], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const titleOpacity = interpolate(frame, [18, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [18, 50], [0.85, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.2)),
  });
  const bodyOpacity = interpolate(frame, [60, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaOpacity = interpolate(frame, [100, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 1 + Math.sin(frame / 10) * 0.03;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 55%, #3b1f72 0%, #1e0f4a 50%, #06031a 100%)",
          opacity: bgIn,
        }}
      />

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 1000,
          height: 1000,
          transform: "translate(-50%, -50%)",
          background:
            "radial-gradient(circle, rgba(180,140,255,0.18) 0%, transparent 65%)",
          opacity: titleOpacity * 0.9,
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
          gap: 28,
          paddingLeft: "6%",
          paddingRight: "6%",
        }}
      >
        <div
          style={{
            opacity: titleOpacity,
            transform: `translateY(${titleY}px) scale(${titleScale})`,
            transformOrigin: "center center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 30,
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: "#c9b6ff",
              fontWeight: 600,
            }}
          >
            The End of the Old Way
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 96,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: "-0.04em",
              color: "transparent",
              background:
                "linear-gradient(135deg, #fff6ff 0%, #d9bbff 45%, #8e68e8 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 0 50px rgba(190,140,255,0.3)",
            }}
          >
            The Chain Is Now Yours
          </div>
        </div>

        <div
          style={{
            opacity: bodyOpacity,
            maxWidth: 900,
            textAlign: "center",
            fontSize: 30,
            color: "#e2d4ff",
            lineHeight: 1.5,
            fontWeight: 500,
          }}
        >
          You now have the map. The next domino that falls is the one you place.
          <br />
          Small, consistent, correct choices — that is how the cascade is won.
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            transform: `scale(${pulse})`,
            marginTop: 8,
            padding: "18px 38px",
            borderRadius: 999,
            background:
              "linear-gradient(135deg, #6c45d8 0%, #a87bff 50%, #c9b1ff 100%)",
            boxShadow:
              "0 20px 50px rgba(120,70,220,0.45), 0 0 50px rgba(180,130,255,0.35)",
            color: "#fff",
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "0.04em",
          }}
        >
          Start With The Next Domino Today
        </div>

        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 4,
            fontSize: 20,
            color: "#b59df2",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Thank you for watching.
        </div>
      </div>
    </AbsoluteFill>
  );
};

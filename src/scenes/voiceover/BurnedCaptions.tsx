import { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { Caption } from "@remotion/captions";
import { createTikTokStyleCaptions } from "@remotion/captions";

export interface BurnedCaptionsProps {
  captions: Caption[];
  combineWithinMs?: number;
  position?: "lower-third" | "center" | "bottom";
  accent?: string;
  fontSize?: number;
  fontWeight?: number;
}

const phaseColorForSceneStart = (startMs: number): string => {
  const t = startMs / 1000;
  const sceneEstimate = Math.min(37, Math.max(1, Math.floor(t / 5.8) + 1));
  if (sceneEstimate <= 10) return "#d4c0ff";
  if (sceneEstimate <= 20) return "#b8d5ff";
  if (sceneEstimate <= 30) return "#b8ffd8";
  return "#ffe3b8";
};

const CaptionPage: React.FC<{
  page: ReturnType<typeof createTikTokStyleCaptions>["pages"][number];
  accent: string;
  fontSize: number;
  fontWeight: number;
  positionFromBottomPct: number;
}> = ({ page, accent, fontSize, fontWeight, positionFromBottomPct }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = (frame / fps) * 1000;
  const absoluteTimeMs = page.startMs + currentTimeMs;

  const pageFrames = Math.ceil(
    Math.min(
      (page.tokens[page.tokens.length - 1].toMs - page.startMs) / 1000 * fps + 2,
      ((page.tokens[page.tokens.length - 1].toMs - page.startMs) / 1000 + 0.35) * fps
    )
  );
  const entry = interpolate(frame, [0, Math.min(6, pageFrames * 0.25)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const exit = interpolate(
    frame,
    [Math.max(0, pageFrames - 8), pageFrames],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    }
  );
  const opacity = Math.min(entry, exit);
  const y = interpolate(1 - entry, [0, 1], [0, 14], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        pointerEvents: "none",
        paddingBottom: `${positionFromBottomPct}%`,
      }}
    >
      <div
        style={{
          maxWidth: "82%",
          width: "min(1100px, 92vw)",
          textAlign: "center",
          opacity,
          translate: `0 ${y}px`,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "12px 22px",
            borderRadius: 18,
            backgroundColor: "rgba(8, 4, 20, 0.55)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.4)",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            fontSize,
            fontWeight,
            lineHeight: 1.22,
            letterSpacing: "-0.01em",
          }}
        >
          {page.tokens.map((token, i) => {
            const active = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
            const word = i === 0 ? token.text.trimStart() : ` ${token.text.trim()}`;
            const activeVal = active ? 1 : 0;
            const scaleAmt = interpolate(activeVal, [0, 1], [1, 1.06]);
            const yShift = interpolate(activeVal, [0, 1], [0, -1]);
            return (
              <span
                key={`${token.fromMs}-${i}`}
                style={{
                  color: active ? accent : "rgba(255,255,255,0.92)",
                  textShadow: active
                    ? `0 0 18px ${accent}aa, 0 2px 6px rgba(0,0,0,0.55)`
                    : "0 2px 6px rgba(0,0,0,0.55)",
                  display: "inline-block",
                  transform: `translateY(${yShift}px) scale(${scaleAmt})`,
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const BurnedCaptions: React.FC<BurnedCaptionsProps> = ({
  captions,
  combineWithinMs = 1400,
  position = "lower-third",
  accent,
  fontSize = 46,
  fontWeight = 800,
}) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: combineWithinMs,
      }),
    [captions, combineWithinMs]
  );

  const positionFromBottomPct =
    position === "center" ? 46 : position === "bottom" ? 3 : 5;

  if (pages.length === 0) return null;

  return (
    <AbsoluteFill style={{ zIndex: 50 }}>
      {pages.map((page, i) => {
        const nextPage = pages[i + 1] ?? null;
        const startFrame = Math.max(0, (page.startMs / 1000) * fps);
        const nextStart = nextPage ? (nextPage.startMs / 1000) * fps : Infinity;
        const endFromTokens =
          ((page.tokens[page.tokens.length - 1].toMs - page.startMs) / 1000) * fps;
        const endFrame = Math.min(nextStart, startFrame + endFromTokens + 12);
        const durationInFrames = Math.max(2, Math.ceil(endFrame - startFrame));
        const pageAccent =
          accent ??
          phaseColorForSceneStart(
            page.startMs
          );
        return (
          <Sequence
            key={`${page.startMs}-${i}`}
            from={Math.floor(startFrame)}
            durationInFrames={durationInFrames}
          >
            <CaptionPage
              page={page as unknown as ReturnType<typeof createTikTokStyleCaptions>["pages"][number]}
              accent={pageAccent}
              fontSize={fontSize}
              fontWeight={fontWeight}
              positionFromBottomPct={positionFromBottomPct}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

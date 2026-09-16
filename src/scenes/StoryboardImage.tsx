import { AbsoluteFill, Easing, Img, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { sceneMap } from "./sceneMap";

export type KenBurnsPreset =
  | "zoomInRight"
  | "zoomInLeft"
  | "zoomOutRight"
  | "zoomOutLeft"
  | "panRight"
  | "panLeft"
  | "panUp"
  | "subtle";

interface StoryboardImageProps {
  sceneId: number;
  preset?: KenBurnsPreset;
  intensity?: number;
}

const PRESETS: Record<
  KenBurnsPreset,
  {
    scale: [number, number];
    x: [number, number];
    y: [number, number];
  }
> = {
  zoomInRight: { scale: [1, 1.2], x: [0, 60], y: [0, -20] },
  zoomInLeft: { scale: [1, 1.2], x: [0, -60], y: [0, -20] },
  zoomOutRight: { scale: [1.22, 1], x: [-60, 0], y: [-20, 0] },
  zoomOutLeft: { scale: [1.22, 1], x: [60, 0], y: [-20, 0] },
  panRight: { scale: [1.1, 1.1], x: [-55, 45], y: [0, 0] },
  panLeft: { scale: [1.1, 1.1], x: [45, -55], y: [0, 0] },
  panUp: { scale: [1.12, 1.12], x: [0, 0], y: [30, -40] },
  subtle: { scale: [1.02, 1.08], x: [0, 15], y: [0, -10] },
};

const PHASE_VIGNETTE: Record<number, string> = {
  1: "linear-gradient(180deg, rgba(40,20,90,0.22) 0%, rgba(10,5,25,0.74) 100%)",
  2: "linear-gradient(180deg, rgba(20,40,90,0.22) 0%, rgba(5,15,35,0.76) 100%)",
  3: "linear-gradient(180deg, rgba(20,70,55,0.22) 0%, rgba(5,25,20,0.76) 100%)",
  4: "linear-gradient(180deg, rgba(90,60,20,0.24) 0%, rgba(30,18,5,0.78) 100%)",
};

const PHASE_COLORS: Record<number, { from: string; mid: string; to: string }> = {
  1: { from: "#2a1550", mid: "#4a2580", to: "#1a0d3a" },
  2: { from: "#1a2a50", mid: "#2a4a8a", to: "#0a1a3a" },
  3: { from: "#1a3a2a", mid: "#2a6a5a", to: "#0a2a1a" },
  4: { from: "#3a2a10", mid: "#5a4a20", to: "#2a1a00" },
};

const STYLE_MAP: Record<number, string> = {
  1: "cinematic anime illustration, purple dusk atmosphere, emotional loneliness, empty schoolyard setting, golden hour rim lighting, detailed character acting, 16:9 widescreen, high contrast storybook quality",
  2: "cinematic anime illustration, cool blue urban palette, invisible presence feeling, muted city background, soft rain atmosphere, 16:9 widescreen composition",
  3: "cinematic anime illustration, massive wall dwarfing character, oppressive scale, charcoal and rust palette, realization dawning on face, wind-swept cape, 16:9 widescreen",
  4: "cinematic anime illustration, soft color grading, school hallway reflections, glass and mirror imagery, quiet guilt transformation, emotional clarity, 16:9 widescreen",
  5: "cinematic anime illustration, reckless forward charge composition, dynamic diagonal lines, warm orange dust clouds, courage but blindness in eyes, wide angle distortion, 16:9 widescreen",
  6: "cinematic anime illustration, melancholic snow-fall atmosphere, depth through fog layers, sword on back, gentle forward movement, deep emotional undercurrent, 16:9 widescreen",
  7: "cinematic anime illustration, red scarf flowing, dramatic protective pose, breaking point expression, soft bloom lighting, emotional weight visible in posture, 16:9 widescreen",
  8: "cinematic anime illustration, glowing aura training ground, sweat and effort, orange sunset sky, character pausing mid-punch with realization, muscle and ki energy, 16:9 widescreen",
  9: "cinematic anime illustration, notebook and sketches, green hair deep in thought, analytical composition, cause-and-effect diagrams glowing in air, hopeful lighting, 16:9 widescreen",
  10: "cinematic anime illustration, classroom observation, cold clinical composition, white uniform, character watching from shadows, subtle social power dynamics visible, 16:9 widescreen",
  11: "cinematic anime illustration, yellow and black tri-force hair, shaking terrified pose, lightning aura around body, moment of clarity cutting through panic, forest background, 16:9 widescreen",
  12: "cinematic anime illustration, hokage stone faces looming, teenage rebellion posture, sunset village rooftops, legacy versus self conflict, 16:9 widescreen composition",
  13: "cinematic anime illustration, pink spiky hair fire-user, fist clenched mid-leap, battle dust swirling, first warning signs flickering behind, dynamic shonen action, 16:9 widescreen",
  14: "cinematic anime illustration, green curly hair analyzing past, flashback montage visual cues, notebook in hand, domino chain glowing in background, 16:9 widescreen",
  15: "cinematic anime illustration, dark jacketed sword god, cracked mirror reflection, identity crisis composition, dark stormy background, turning point in eyes, 16:9 widescreen",
  16: "cinematic anime illustration, character looking at reflection in water, ripples distorting self-image, twilight riverbank, internal cost visible in eyes, 16:9 widescreen",
  17: "cinematic anime illustration, small crack spreading across massive structure, exponential collapse progression, character frozen watching, dark apocalyptic palette, 16:9 widescreen",
  18: "cinematic anime illustration, character's hand stopping a falling domino mid-tumble, frozen time effect, cascade halted behind, spotlight on intervention point, 16:9 widescreen",
  19: "cinematic anime illustration, split-screen ancient-to-modern montage, Greek amphora next to smartphone, recurring human gestures across eras, warm parchment tones, 16:9 widescreen",
  20: "cinematic anime illustration, everyday moments montage — bedroom, office, café — same hesitation pose repeated, visual pattern overlay, diagnostic composition, 16:9 widescreen",
  21: "cinematic anime illustration, character wearing conceptual glasses/lens, world reframed into connected nodes and lines, golden ratio glow, sudden clarity expression, 16:9 widescreen",
  22: "cinematic anime illustration, generic advice sticky notes peeling off wall, actual pattern glowing beneath, surface-level vs root-level visual metaphor, 16:9 widescreen",
  23: "cinematic anime illustration, blueprint reveal, full domino chain diagram unrolling, system of connected arrows, character presenting confidently, warm reveal lighting, 16:9 widescreen",
  24: "cinematic anime illustration, character smashing first domino with decisive hand, cascade frozen before it starts, dramatic impact frame, spiky hair silhouette, 16:9 widescreen",
  25: "cinematic anime illustration, door opening to new capability glow, character stepping through threshold, aura expanding, new power awakening in eyes, 16:9 widescreen",
  26: "cinematic anime illustration, snowball rolling downhill gaining size, positive change montage in background, character running with growing smile, sunrise palette, 16:9 widescreen",
  27: "cinematic anime illustration, character standing at threshold between two worlds, old identity items scattered on ground, packed bags, breathing in deeply, 16:9 widescreen",
  28: "cinematic anime illustration, character extracting poisoned root with bare hands from deep soil, clean break at source, tree above blooming instantly, nature transformation, 16:9 widescreen",
  29: "cinematic anime illustration, character walking busy street, domino patterns highlighted around strangers, conscious smile, coffee shop / commute scene, 16:9 widescreen",
  30: "cinematic anime illustration, split timeline diptych, left side decay from inaction, right side what-could-be, character viewing projection with horror, 16:9 widescreen",
  31: "cinematic anime illustration, snowball of small wins accumulating into massive boulder of success, character riding forward confidently, dawn gold palette, 16:9 widescreen",
  32: "cinematic anime illustration, cosmic scale reveal, galaxies, trees, stock markets, relationships — all rendered as domino chains, one universal principle, 16:9 widescreen",
  33: "cinematic anime illustration, before/after portrait diptych, left victim posture, right transformed posture, same face new identity, character fully in new skin, 16:9 widescreen",
  34: "cinematic anime illustration, character in center, four quadrants showing work, love, health, learning — each with the pattern highlighted and being addressed, 16:9 widescreen",
  35: "cinematic anime illustration, character returning to childhood swing from scene 1, now standing tall, same location different perspective, golden hour closure, 16:9 widescreen",
  36: "cinematic anime illustration, character's eyes with new lens reflection, irises showing domino-chain universe, quiet dawn epiphany, soft permanent shift expression, 16:9 widescreen",
  37: "cinematic anime illustration, final triumphant frame, character walking into sunrise, old clothes discarded behind, new silhouette, bridge-burning visual metaphor, 16:9 widescreen",
};

const CHARACTER =
  "a single consistent original character, early-to-mid-30s, gender-neutral, hoodie over a button-down shirt, expressive body language, same recognizable face and build in every frame, emotionally honest performance";

function pickPreset(sceneId: number): KenBurnsPreset {
  const all: KenBurnsPreset[] = [
    "zoomInRight",
    "zoomInLeft",
    "zoomOutRight",
    "zoomOutLeft",
    "panRight",
    "panLeft",
    "panUp",
    "subtle",
  ];
  return all[(sceneId - 1) % all.length];
}

function phaseOf(id: number) {
  return id <= 10 ? 1 : id <= 20 ? 2 : id <= 30 ? 3 : 4;
}

function buildImagePrompt(sceneId: number): string {
  const entry = sceneMap[sceneId - 1];
  if (!entry) {
    return `Anime storyboard scene ${sceneId}. Cinematic 16:9 composition.`;
  }
  const style = STYLE_MAP[sceneId] ?? STYLE_MAP[1];
  return [
    `Scene ${sceneId} of 37. Title: ${entry.title}.`,
    `${CHARACTER}.`,
    `Narrative principle: ${entry.keyIdea}.`,
    `Visual reference: ${entry.animeScene}.`,
    `Art direction: ${style}.`,
  ].join(" ");
}

export const StoryboardImage: React.FC<StoryboardImageProps> = ({
  sceneId,
  preset,
  intensity = 1,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const chosenPreset = preset ?? pickPreset(sceneId);
  const motion = PRESETS[chosenPreset];
  const phase = phaseOf(sceneId);
  const ease = Easing.inOut(Easing.ease);

  const t = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = ease(t);

  const scaleVal =
    interpolate(eased, [0, 1], motion.scale, {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }) *
      (0.5 + 0.5 * intensity) +
    (1 - intensity);

  const xVal = interpolate(
    eased,
    [0, 1],
    [motion.x[0] * intensity, motion.x[1] * intensity],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const yVal = interpolate(
    eased,
    [0, 1],
    [motion.y[0] * intensity, motion.y[1] * intensity],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const vignetteOpacity = interpolate(
    frame,
    [0, 20, durationInFrames - 20, durationInFrames],
    [0, 0.92, 0.92, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const imageFadeIn = interpolate(frame, [0, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const phaseVignette = PHASE_VIGNETTE[phase];
  const phaseColors = PHASE_COLORS[phase];
  const prompt = buildImagePrompt(sceneId);
  const imageSrc = `https://coresg-normal.trae.ai/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=landscape_16_9`;

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(135deg, ${phaseColors.from} 0%, ${phaseColors.mid} 52%, ${phaseColors.to} 100%)`,
        }}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          transform: `translate(${xVal}px, ${yVal}px) scale(${scaleVal})`,
        }}
      >
        <Img
          src={imageSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: imageFadeIn,
          }}
        />
      </AbsoluteFill>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: phaseVignette,
          opacity: vignetteOpacity * 0.35,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.32) 100%)",
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT_PATH = path.join(__dirname, "public", "voiceover", "script.json");
const OUT_DIR = path.join(__dirname, "public", "voiceover");

const STYLE_MAP = {
  1: "cinematic anime illustration, purple dusk atmosphere, emotional loneliness, empty schoolyard, golden hour rim lighting, detailed character acting, 16:9 widescreen",
  2: "cinematic anime illustration, cool blue urban palette, invisible presence, muted city, soft rain, 16:9 widescreen",
  3: "cinematic anime illustration, massive wall dwarfing character, oppressive scale, charcoal rust palette, wind-swept cape, 16:9 widescreen",
  4: "cinematic anime illustration, soft color grading, school hallway reflections, glass mirrors, quiet guilt transformation, 16:9 widescreen",
  5: "cinematic anime illustration, reckless forward charge, dynamic diagonal lines, warm orange dust, 16:9 widescreen",
  6: "cinematic anime illustration, melancholic snowfall, depth through fog layers, sword on back, gentle forward movement, 16:9 widescreen",
  7: "cinematic anime illustration, red scarf flowing, dramatic protective pose, soft bloom lighting, emotional weight, 16:9 widescreen",
  8: "cinematic anime illustration, glowing aura training ground, sweat effort, orange sunset sky, realization mid-punch, 16:9 widescreen",
  9: "cinematic anime illustration, notebook sketches, green hair analytical pose, cause-and-effect diagrams glowing in air, 16:9 widescreen",
  10: "cinematic anime illustration, classroom observation, cold clinical composition, white uniform, watching from shadows, 16:9 widescreen",
  11: "cinematic anime illustration, yellow black hair, terrified shaking pose, lightning aura, clarity cutting through panic, forest, 16:9 widescreen",
  12: "cinematic anime illustration, hokage stone faces looming, teenage rebellion posture, sunset village rooftops, 16:9 widescreen",
  13: "cinematic anime illustration, pink spiky hair fire-user, clenched fist mid-leap, battle dust, dynamic shonen action, 16:9 widescreen",
  14: "cinematic anime illustration, green curly hair, flashback montage, notebook in hand, domino chain glowing, 16:9 widescreen",
  15: "cinematic anime illustration, dark jacketed sword god, cracked mirror reflection, identity crisis, dark stormy background, 16:9 widescreen",
  16: "cinematic anime illustration, reflection in water, ripples distorting self-image, twilight riverbank, 16:9 widescreen",
  17: "cinematic anime illustration, small crack spreading across massive structure, exponential collapse, frozen watching character, 16:9 widescreen",
  18: "cinematic anime illustration, hand stopping a falling domino mid-tumble, frozen time, cascade halted behind, spotlight, 16:9 widescreen",
  19: "cinematic anime illustration, split-screen ancient to modern, Greek amphora next to smartphone, recurring human gestures, 16:9 widescreen",
  20: "cinematic anime illustration, everyday moments montage, bedroom office cafe, same hesitation pose repeated, 16:9 widescreen",
  21: "cinematic anime illustration, character wearing conceptual lens glasses, world reframed into connected nodes lines, 16:9 widescreen",
  22: "cinematic anime illustration, sticky notes peeling off wall, actual pattern glowing beneath, surface vs root metaphor, 16:9 widescreen",
  23: "cinematic anime illustration, blueprint reveal, full domino chain diagram unrolling, system of arrows, 16:9 widescreen",
  24: "cinematic anime illustration, decisive hand smashing first domino, cascade frozen before it starts, impact frame, 16:9 widescreen",
  25: "cinematic anime illustration, door opening to new capability glow, character stepping through threshold, aura expanding, 16:9 widescreen",
  26: "cinematic anime illustration, snowball rolling downhill gaining size, positive change montage, growing smile, sunrise, 16:9 widescreen",
  27: "cinematic anime illustration, threshold between two worlds, old identity items on ground, packed bags, deep breath, 16:9 widescreen",
  28: "cinematic anime illustration, extracting poisoned root from soil, clean break source, tree above blooming instantly, 16:9 widescreen",
  29: "cinematic anime illustration, busy street, domino patterns highlighted around strangers, conscious smile, coffee shop commute, 16:9 widescreen",
  30: "cinematic anime illustration, split timeline diptych, left decay inaction, right what could be, horror in character eyes, 16:9 widescreen",
  31: "cinematic anime illustration, snowball of small wins into massive success boulder, riding forward confidently, dawn gold, 16:9 widescreen",
  32: "cinematic anime illustration, cosmic scale, galaxies trees stock markets relationships all domino chains, one universal principle, 16:9 widescreen",
  33: "cinematic anime illustration, before after portrait, left victim posture, right transformed, same face new identity, 16:9 widescreen",
  34: "cinematic anime illustration, four quadrants work love health learning, each pattern highlighted addressed, 16:9 widescreen",
  35: "cinematic anime illustration, return to childhood swing, now standing tall, same location new perspective, golden hour, 16:9 widescreen",
  36: "cinematic anime illustration, eye close-up new lens reflection, irises showing domino chain universe, dawn epiphany, 16:9 widescreen",
  37: "cinematic anime illustration, triumphant walk into sunrise, old clothes discarded behind, new silhouette, bridge burning metaphor, 16:9 widescreen",
};

function wordsPerChar(wpm) {
  const cpm = (wpm * 5) / 60;
  return 1 / cpm;
}

function estimateNarrationSeconds(text, meta) {
  const chars = text.trim().length;
  return chars * wordsPerChar(meta.characterWpm) + meta.extraPaddingSeconds;
}

function tokenize(text, startSeconds, meta) {
  const secPerChar = wordsPerChar(meta.characterWpm);
  const tokens = [];
  const re = /(\s*)([^\s]+)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    tokens.push({ spacesBefore: m[1] || "", word: m[2] });
  }
  const result = [];
  let t = startSeconds;
  for (const token of tokens) {
    const prefixDur = token.spacesBefore.length * secPerChar * 0.6;
    const wordDur = Math.max(0.08, token.word.length * secPerChar);
    const from = (t + prefixDur) * 1000;
    const to = (t + prefixDur + wordDur) * 1000;
    result.push({
      text: token.spacesBefore + token.word,
      startMs: Math.round(from),
      endMs: Math.round(to),
      fromMs: Math.round(from),
      toMs: Math.round(to),
      confidence: 1,
    });
    t += prefixDur + wordDur;
  }
  return result;
}

function msToSrt(t) {
  const h = Math.floor(t / 3_600_000);
  const m = Math.floor((t % 3_600_000) / 60_000);
  const s = Math.floor((t % 60_000) / 1000);
  const ms = t % 1000;
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}

function toSrt(captions, combineWithinMs = 1400) {
  const lines = [];
  let buffer = [];
  let idx = 1;
  const flush = () => {
    if (buffer.length === 0) return;
    const start = buffer[0].startMs;
    const end = buffer[buffer.length - 1].endMs;
    const text = buffer.map((c) => c.text).join("").trim();
    lines.push(String(idx));
    lines.push(`${msToSrt(start)} --> ${msToSrt(end)}`);
    lines.push(text);
    lines.push("");
    idx += 1;
    buffer = [];
  };
  let windowStart = -1;
  for (const cap of captions) {
    if (windowStart < 0) windowStart = cap.startMs;
    if (cap.startMs - windowStart > combineWithinMs) {
      flush();
      windowStart = cap.startMs;
    }
    buffer.push(cap);
  }
  flush();
  return lines.join("\n");
}

function parseArgs(argv) {
  const only = new Set();
  let regenerate = false;
  let concurrency = 3;
  let timingOnly = false;

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--regenerate" || a === "-r") regenerate = true;
    else if (a === "--timing-only" || a === "-t") timingOnly = true;
    else if (a === "--only" || a === "-o") {
      const list = argv[++i] || "";
      list
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => Number.isFinite(n))
        .forEach((n) => only.add(n));
    } else if (a === "--concurrency" || a === "-j") {
      concurrency = Math.max(1, parseInt(argv[++i] || "3", 10));
    }
  }
  return { regenerate, only, concurrency, timingOnly };
}

async function ttsElevenlabs(text, dest, preset, apiKey) {
  const voiceId = preset.voice_id || "EXAVITQu4vr4xnSDxMaL";
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: preset.model_id || "eleven_multilingual_v2",
        voice_settings: preset.voice_settings || {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
        },
      }),
    }
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`TTS HTTP ${res.status}: ${res.statusText} — ${detail.slice(0, 280)}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.promises.writeFile(dest, buf);
  return buf.length;
}

async function pMap(items, fn, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

const SCENE_EXTRA = {
  1: { keyIdea: "The real problem is not lack of talent but a mismatch between effort, identity, and understanding.", animeScene: "Naruto fails the academy, tries to perform the Shadow Clone Jutsu, and sits on a swing alone while the deeper reason behind his struggle becomes visible." },
  2: { keyIdea: "The obstacle is often invisible until you name it.", animeScene: "Saitama gets ignored and misunderstood while trying to help, showing how invisible a person can feel even when they are strong." },
  3: { keyIdea: "Patterns repeat because the source of the problem is larger than the symptom.", animeScene: "Eren looks at the wall in Attack on Titan and realizes his life has been shaped by a system bigger than his own instincts." },
  4: { keyIdea: "Once you frame a problem correctly, the answer becomes much clearer.", animeScene: "Shoya in A Silent Voice sees how his past actions formed a pattern of harm, and the truth becomes undeniable." },
  5: { keyIdea: "The problem is not always where your effort is focused.", animeScene: "Luffy charges ahead with reckless courage, showing how a person can be brave but still blind to the actual structure of the problem." },
  6: { keyIdea: "The true cause is often hidden beneath the visible struggle.", animeScene: "Tanjiro walks through grief and danger, seeing past the obvious pain to the deeper emotional truth underneath." },
  7: { keyIdea: "The same pattern shows up in many places once you know what to look for.", animeScene: "Mikasa confronts the emotional cost of trying to protect everyone and sees the pattern of self-sacrifice becoming destructive." },
  8: { keyIdea: "A system is not visible until its mechanism is named.", animeScene: "Goku keeps pushing without understanding the deeper mechanism of growth, and realizes that strength alone is not enough." },
  9: { keyIdea: "The best thinkers predict the next consequence before it happens.", animeScene: "Midoriya reimagines his goal not as a dream, but as a process that leads to the next cause and effect." },
  10: { keyIdea: "The visible pattern is caused by a deeper structure underneath it.", animeScene: "Ayanokoji quietly observes a social system, showing how people's survival patterns create larger structures beyond their awareness." },
  11: { keyIdea: "A single sentence can reveal the hidden logic of an entire problem.", animeScene: "Zenitsu faces his fear and realizes that emotional clarity is a stronger force than panic." },
  12: { keyIdea: "Repeated outcomes are usually caused by repeated conditions.", animeScene: "Boruto feels trapped by legacy and family expectation, revealing how recurring causes always produce familiar results." },
  13: { keyIdea: "The earlier you spot the first trigger, the easier the whole chain becomes to stop.", animeScene: "Natsu keeps fighting instinctively while missing the early warning signs that the problem is already in motion." },
  14: { keyIdea: "Understanding the chain means finding where it started, not just where it hurts.", animeScene: "Deku traces back through his own life to see how one small moment led to everything that followed." },
  15: { keyIdea: "The turn happens when you identify the original trigger rather than the latest symptom.", animeScene: "Yato confronts his own self-concept and realizes the chain started long before the visible crisis." },
  16: { keyIdea: "The real consequence is the identity shift, not the external event.", animeScene: "A character realizes the cost was never about the failure, but about how they saw themselves after." },
  17: { keyIdea: "Small problems that compound become exponentially harder to fix.", animeScene: "Showing the compounding effect of ignoring a small problem until it becomes catastrophic." },
  18: { keyIdea: "Breaking one link in the chain stops the entire effect that follows.", animeScene: "A character stops one domino and watches the cascade halt, seeing the power of intervention." },
  19: { keyIdea: "Human patterns are timeless; only the stage changes.", animeScene: "Historical patterns echoing in modern contexts, showing these aren't new problems." },
  20: { keyIdea: "The pattern becomes recognizable in everyday life once the map is known.", animeScene: "Common scenes of hesitation, overthinking, avoidance, decision loops, and emotional shutdown are shown as the same pattern in different clothes." },
  21: { keyIdea: "The lens you use determines what problems you can see.", animeScene: "A character looks at the world through a new framework and sees everything differently." },
  22: { keyIdea: "Most advice works for the problem it was designed for, not the pattern underneath.", animeScene: "Standard solutions fail because they're treating the symptom, not the pattern." },
  23: { keyIdea: "Real solutions target the pattern, not just the symptom.", animeScene: "A new approach is revealed that addresses the entire chain, not just one piece." },
  24: { keyIdea: "Breaking the pattern starts with breaking the first domino.", animeScene: "The first intervention point is identified and executed, halting the cascade." },
  25: { keyIdea: "Breaking a pattern creates the space for new capability.", animeScene: "A character changes behavior and gains access to a level of capability they could not reach before." },
  26: { keyIdea: "Success compounds just as much as failure does.", animeScene: "One change creates another change; the cascade now works in the opposite direction." },
  27: { keyIdea: "The final shift requires letting go of the old story completely.", animeScene: "The character stands at the threshold, ready to leave behind the old identity." },
  28: { keyIdea: "Healing means addressing the root, not just managing the branches.", animeScene: "The original source of the pattern is addressed, not just managed or survived." },
  29: { keyIdea: "Awareness becomes the tool for choice.", animeScene: "The character now recognizes the pattern everywhere and makes conscious choices to interrupt it." },
  30: { keyIdea: "Inaction has a compounding cost; it's not free.", animeScene: "Showing what would happen if the character stayed stuck; the exponential cost is undeniable." },
  31: { keyIdea: "Small consistent choices compound into a new life.", animeScene: "Small consistent choices create a new cascade of positive outcomes." },
  32: { keyIdea: "Understanding dominoes is understanding how reality works.", animeScene: "The universal law is revealed: all systems, all problems, all growth follow the same domino pattern." },
  33: { keyIdea: "Identity is not fixed; it's built through repeated choices.", animeScene: "The character's identity has shifted; they are no longer defined by the old pattern." },
  34: { keyIdea: "The same principle applies to every area of life.", animeScene: "The character sees the pattern in relationships, careers, health, learning—everywhere." },
  35: { keyIdea: "Understanding the beginning changes how you experience the whole story.", animeScene: "The character returns to the original place of pain or failure and sees it clearly for the first time." },
  36: { keyIdea: "Once you see the pattern, you see it everywhere, forever.", animeScene: "The old world is gone; the character can never unsee what they've learned." },
  37: { keyIdea: "The real shift is not in a single moment; it is in the moment you stop going back.", animeScene: "The main character commits to a new life pattern, visually signalling that the old version is over and the transformed one is now active." },
};

async function readScript() {
  const raw = JSON.parse(await fs.promises.readFile(SCRIPT_PATH, "utf-8"));
  return raw;
}

async function main() {
  const { regenerate, only, concurrency, timingOnly } = parseArgs(process.argv);
  await fs.promises.mkdir(OUT_DIR, { recursive: true });

  const script = await readScript();
  const meta = script.meta;
  const scenes = script.scenes || [];
  const queue = scenes.filter((s) => (only.size === 0 ? true : only.has(s.id)));
  const apiKey = process.env.ELEVENLABS_API_KEY || "";
  const preset = meta.voicePreset || {};
  const useTts = !timingOnly && Boolean(apiKey);
  if (!useTts) {
    console.log(
      timingOnly
        ? "⏱️  --timing-only set: skipping TTS, re-generating captions & SRT from char-count only."
        : "ℹ️  No ELEVENLABS_API_KEY set. Running in offline mode (char-count captions + SRT only). To produce real MP3s, rerun with ELEVENLABS_API_KEY=<your key>."
    );
  }

  console.log(`\nProcessing ${queue.length} scenes (concurrency=${concurrency})…`);
  console.log(`Output: ${OUT_DIR}\n`);

  let cursorSeconds = 0;
  const sceneDurations = {};
  const sceneStarts = {};
  const globalCaptions = [];

  await pMap(
    queue,
    async (scene, idx) => {
      const i = idx;
      void i;
      const paddedId = String(scene.id).padStart(2, "0");
      const mp3 = path.join(OUT_DIR, `scene_${paddedId}.mp3`);
      const captionsFile = path.join(OUT_DIR, `scene_${paddedId}.captions.json`);
      const srtFile = path.join(OUT_DIR, `scene_${paddedId}.srt`);
      const exists = fs.existsSync(mp3);

      if (useTts) {
        if (!exists || regenerate) {
          try {
            const size = await ttsElevenlabs(scene.narration, mp3, preset, apiKey);
            console.log(
              `  • scene_${paddedId}.mp3 … TTS OK (${Math.round(size / 1024)} KB)`
            );
          } catch (err) {
            console.error(
              `  • scene_${paddedId}.mp3 … TTS FAILED: ${
                err instanceof Error ? err.message : String(err)
              }`
            );
          }
        } else {
          console.log(`  • scene_${paddedId}.mp3 … cached, skip TTS`);
        }
      }

      return { scene, mp3, captionsFile, srtFile };
    },
    concurrency
  );

  // Compute global timeline & captions sequentially (for correct start offsets).
  for (const scene of scenes) {
    const paddedId = String(scene.id).padStart(2, "0");
    const durSec = estimateNarrationSeconds(scene.narration, meta);
    const frames = Math.max(150, Math.ceil(durSec * meta.fps));
    const caps = tokenize(scene.narration, cursorSeconds, meta);
    sceneDurations[scene.id] = frames;
    sceneStarts[scene.id] = Math.round(cursorSeconds * meta.fps);
    globalCaptions.push(...caps);
    cursorSeconds += frames / meta.fps;

    // Per-scene captions (relative) + SRT
    const offsetMs = sceneStarts[scene.id] / meta.fps * 1000;
    const rel = caps.map((c) => ({
      ...c,
      startMs: c.startMs - offsetMs,
      endMs: c.endMs - offsetMs,
      fromMs: c.fromMs - offsetMs,
      toMs: c.toMs - offsetMs,
    }));
    await fs.promises.writeFile(
      path.join(OUT_DIR, `scene_${paddedId}.captions.json`),
      JSON.stringify(rel, null, 2)
    );
    await fs.promises.writeFile(
      path.join(OUT_DIR, `scene_${paddedId}.srt`),
      toSrt(rel)
    );
  }

  // Global assets
  await fs.promises.writeFile(
    path.join(OUT_DIR, "captions.json"),
    JSON.stringify(globalCaptions, null, 2)
  );
  await fs.promises.writeFile(
    path.join(OUT_DIR, "full-series.srt"),
    toSrt(globalCaptions)
  );
  await fs.promises.writeFile(
    path.join(OUT_DIR, "timing.json"),
    JSON.stringify(
      {
        fps: meta.fps,
        totalFrames: sceneStarts[37] + sceneDurations[37],
        totalSeconds: cursorSeconds,
        sceneDurations,
        sceneStarts,
        imagePrompts: Object.fromEntries(
          scenes.map((s) => {
            const extra = SCENE_EXTRA[s.id] || { keyIdea: "", animeScene: "" };
            return [
              s.id,
              [
                `Scene ${s.id} of 37. Title: ${s.title}.`,
                `Narrative principle: ${extra.keyIdea}.`,
                `Visual reference: ${extra.animeScene}.`,
                `Art direction: ${STYLE_MAP[s.id] || STYLE_MAP[1]}.`,
              ].join(" "),
            ];
          })
        ),
      },
      null,
      2
    )
  );

  console.log(
    `\n✅ Done. Total runtime ≈ ${Math.round(cursorSeconds * 10) / 10}s (${
      sceneStarts[37] + sceneDurations[37]
    } frames @ ${meta.fps}fps).`
  );
  console.log(`   • per-scene MP3:        public/voiceover/scene_XX.mp3`);
  console.log(`   • per-scene captions:   public/voiceover/scene_XX.captions.json`);
  console.log(`   • per-scene SRT:        public/voiceover/scene_XX.srt`);
  console.log(`   • full-series captions: public/voiceover/captions.json`);
  console.log(`   • full-series SRT:      public/voiceover/full-series.srt`);
  console.log(`   • timing manifest:      public/voiceover/timing.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

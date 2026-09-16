import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const VOICE = path.join(PUBLIC, "voiceover");
const AMBIENT = path.join(PUBLIC, "ambient");

function writeWavSync(filePath, channels, sampleRate, samples) {
  const numSamples = samples.length / channels;
  const byteRate = sampleRate * channels * 2;
  const blockAlign = channels * 2;
  const dataSize = numSamples * channels * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(v < 0 ? v * 0x8000 : v * 0x7fff, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function generateSilentWav(durationSec, sampleRate = 44100) {
  const n = Math.floor(durationSec * sampleRate);
  return new Float64Array(n * 2);
}

function durationForScene(sceneNarration, meta) {
  const chars = sceneNarration.trim().length;
  const wpm = meta.characterWpm || 153;
  const cpm = (wpm * 5) / 60;
  const secPerChar = 1 / cpm;
  return chars * secPerChar + (meta.extraPaddingSeconds || 0.6);
}

async function main() {
  await fs.promises.mkdir(VOICE, { recursive: true });
  await fs.promises.mkdir(AMBIENT, { recursive: true });

  const script = JSON.parse(
    await fs.promises.readFile(path.join(VOICE, "script.json"), "utf-8")
  );
  const meta = script.meta;
  const scenes = script.scenes || [];
  const SR = 44100;

  let totalSec = 0;
  for (const scene of scenes) {
    const sec = durationForScene(scene.narration, meta);
    totalSec += sec;
    const paddedId = String(scene.id).padStart(2, "0");
    const outWav = path.join(VOICE, `scene_${paddedId}.wav`);
    const outMp3 = path.join(VOICE, `scene_${paddedId}.mp3`);
    if (!fs.existsSync(outWav) && !fs.existsSync(outMp3)) {
      const samples = generateSilentWav(sec + 0.2, SR);
      writeWavSync(outWav, 2, SR, samples);
      console.log(`  • scene_${paddedId}.wav … silent placeholder (${Math.round(sec * 10) / 10}s)`);
    } else {
      console.log(`  • scene_${paddedId}.* … already exists, skip`);
    }
  }

  const customAmbient = path.join(AMBIENT, "50_Most_Beautiful_Classical_Music_Pieces(128k).m4a");
  const fallbackAmbient = path.join(AMBIENT, "ambient-placeholder.wav");
  if (fs.existsSync(customAmbient)) {
    console.log(`\n  • ambient/50_Most_Beautiful_Classical_Music_Pieces(128k).m4a … custom ambient track detected`);
  } else if (!fs.existsSync(fallbackAmbient)) {
    const ambientSec = Math.max(totalSec * 1.05 + 10, 610);
    const samples = generateSilentWav(ambientSec, SR);
    writeWavSync(fallbackAmbient, 2, SR, samples);
    console.log(
      `\n  • ambient/ambient-placeholder.wav … generated fallback ambient placeholder (${Math.round(ambientSec)}s)`
    );
  } else {
    console.log(`\n  • ambient/ambient-placeholder.wav … already exists, skip`);
  }

  console.log(
    `\n✅ Audio fallback ready. Total VO duration ≈ ${Math.round(totalSec * 10) / 10
    }s. Ambient fallback ≈ ${Math.max(totalSec * 1.05 + 10, 610)}s.`
  );
  console.log(
    "   ℹ️  These are WAV placeholders. Add ELEVENLABS_API_KEY and re-run `node generate-voiceover.mjs` for real voice MP3s."
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

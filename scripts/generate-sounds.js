/**
 * 8-Bit Retro Atari Chiptune Audio Generator
 * Generates PCM WAV files with authentic retro synthesizer waveforms:
 * - Pulse/Square waves (12.5%, 25%, 50% duty cycles)
 * - Triangle bass waves
 * - LFSR pseudo-random 8-bit noise for percussion and effects
 * - Arpeggiators, pitch slides, vibrato, and envelopes
 */

const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 44100;

// WAV file writer (16-bit PCM Mono)
function writeWavFile(filePath, samples) {
  const numSamples = samples.length;
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = numSamples * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);

  // "fmt " chunk
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);            // subchunk1 size
  buffer.writeUInt16LE(1, 20);             // PCM format
  buffer.writeUInt16LE(1, 22);             // mono (1 channel)
  buffer.writeUInt32LE(SAMPLE_RATE, 24);   // sample rate
  buffer.writeUInt32LE(byteRate, 28);      // byte rate
  buffer.writeUInt16LE(blockAlign, 32);    // block align
  buffer.writeUInt16LE(16, 34);            // bits per sample

  // "data" chunk
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write samples with soft clipping
  for (let i = 0; i < numSamples; i++) {
    let s = samples[i];
    if (s > 1.0) s = 1.0;
    if (s < -1.0) s = -1.0;
    const intSample = Math.round(s * 32767);
    buffer.writeInt16LE(intSample, 44 + i * 2);
  }

  fs.writeFileSync(filePath, buffer);
  console.log(`Saved: ${filePath} (${(numSamples / SAMPLE_RATE).toFixed(2)}s, ${buffer.length} bytes)`);
}

// Note frequencies (Hz)
const NOTE = {
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, Db4: 277.18, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23,
  Gb4: 369.99, G4: 392.00, Ab4: 415.30, A4: 440.00, Bb4: 466.16, B4: 493.88,
  C5: 523.25, Db5: 554.37, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46,
  G5: 783.99, Ab5: 830.61, A5: 880.00, Bb5: 932.33, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51, G6: 1567.98, A6: 1760.00,
  REST: 0
};

// Waveform oscillators
function pulse(phase, duty = 0.5) {
  const normPhase = phase - Math.floor(phase);
  return normPhase < duty ? 1.0 : -1.0;
}

function triangle(phase) {
  const normPhase = phase - Math.floor(phase);
  return 4.0 * Math.abs(normPhase - 0.5) - 1.0;
}

// 8-bit LFSR pseudo-random noise generator
let lfsr = 0x7FFF;
function retroNoise() {
  const bit = ((lfsr >> 0) ^ (lfsr >> 1)) & 1;
  lfsr = (lfsr >> 1) | (bit << 14);
  return (lfsr & 1) ? 1.0 : -1.0;
}

// -------------------------------------------------------------
// 1. GENERATE THEME (Atari / 8-Bit Retro Chiptune Loop)
// -------------------------------------------------------------
function generateTheme() {
  const BPM = 132;
  const beatSec = 60 / BPM;
  const sixteenth = beatSec / 4;
  const bars = 8;
  const totalBeats = bars * 4;
  const totalDuration = totalBeats * beatSec;
  const totalSamples = Math.floor(totalDuration * SAMPLE_RATE);
  const out = new Float32Array(totalSamples);

  // Chord progression: Am | F | C | G (2 bars each)
  const chords = [
    { name: "Am", root: NOTE.A2, arp: [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.A4], bass: NOTE.A2 },
    { name: "Am", root: NOTE.A2, arp: [NOTE.A3, NOTE.C4, NOTE.E4, NOTE.A4], bass: NOTE.A2 },
    { name: "F",  root: NOTE.F2, arp: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4], bass: NOTE.F2 },
    { name: "F",  root: NOTE.F2, arp: [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.F4], bass: NOTE.F2 },
    { name: "C",  root: NOTE.C2, arp: [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4], bass: NOTE.C2 },
    { name: "C",  root: NOTE.C2, arp: [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4], bass: NOTE.C2 },
    { name: "G",  root: NOTE.G2, arp: [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4], bass: NOTE.G2 },
    { name: "G",  root: NOTE.G2, arp: [NOTE.G3, NOTE.B3, NOTE.D4, NOTE.G4], bass: NOTE.G2 },
  ];

  // Lead melody notes: [note, durationInSixteenths]
  const melodyTrack = [
    // Am (bars 1-2)
    [NOTE.E5, 4], [NOTE.C5, 2], [NOTE.D5, 2], [NOTE.E5, 4], [NOTE.A4, 4],
    [NOTE.B4, 2], [NOTE.C5, 2], [NOTE.D5, 4], [NOTE.E5, 4], [NOTE.C5, 4],
    // F (bars 3-4)
    [NOTE.A5, 4], [NOTE.F5, 2], [NOTE.G5, 2], [NOTE.A5, 4], [NOTE.C5, 4],
    [NOTE.D5, 2], [NOTE.E5, 2], [NOTE.F5, 4], [NOTE.G5, 4], [NOTE.E5, 4],
    // C (bars 5-6)
    [NOTE.G5, 4], [NOTE.E5, 2], [NOTE.F5, 2], [NOTE.G5, 4], [NOTE.C5, 4],
    [NOTE.D5, 2], [NOTE.E5, 2], [NOTE.F5, 2], [NOTE.G5, 2], [NOTE.A5, 4], [NOTE.B5, 4],
    // G (bars 7-8)
    [NOTE.B5, 4], [NOTE.G5, 2], [NOTE.A5, 2], [NOTE.B5, 4], [NOTE.D5, 4],
    [NOTE.E5, 2], [NOTE.D5, 2], [NOTE.C5, 2], [NOTE.B4, 2], [NOTE.A4, 4], [NOTE.REST, 4],
  ];

  // Render Melody
  let melodyTime = 0;
  for (const [freq, count] of melodyTrack) {
    const dur = count * sixteenth;
    const startSamp = Math.floor(melodyTime * SAMPLE_RATE);
    const numSamp = Math.floor(dur * SAMPLE_RATE);

    if (freq > 0) {
      let phase = 0;
      for (let i = 0; i < numSamp && (startSamp + i) < totalSamples; i++) {
        const t = i / SAMPLE_RATE;
        // retro staccato envelope
        const env = t < 0.02 ? (t / 0.02) : Math.max(0, 1.0 - (t / dur) * 0.4);
        // vibrato
        const vib = t > 0.15 ? Math.sin(2 * Math.PI * 6.0 * (t - 0.15)) * 6.0 : 0;
        const currentFreq = freq + vib;
        phase += currentFreq / SAMPLE_RATE;
        const val = pulse(phase, 0.25) * env * 0.22;
        out[startSamp + i] += val;
      }
    }
    melodyTime += dur;
  }

  // Render Fast Retro Arpeggios (16th notes throughout)
  const totalSixteenths = bars * 16;
  let arpPhase = 0;
  for (let s = 0; s < totalSixteenths; s++) {
    const barIdx = Math.floor(s / 16);
    const chord = chords[barIdx % chords.length];
    const noteIdx = s % chord.arp.length;
    const freq = chord.arp[noteIdx];
    const startSamp = Math.floor(s * sixteenth * SAMPLE_RATE);
    const numSamp = Math.floor(sixteenth * SAMPLE_RATE);

    for (let i = 0; i < numSamp && (startSamp + i) < totalSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 22.0); // plucky chip envelope
      arpPhase += freq / SAMPLE_RATE;
      const val = pulse(arpPhase, 0.5) * env * 0.14;
      out[startSamp + i] += val;
    }
  }

  // Render Bouncy Retro Bassline (Triangle + Square octave, 8th notes)
  const totalEighths = bars * 8;
  const eighth = beatSec / 2;
  let bassPhase = 0;
  for (let e = 0; e < totalEighths; e++) {
    const barIdx = Math.floor(e / 8);
    const chord = chords[barIdx % chords.length];
    const beatInBar = e % 8;
    // Bouncy pattern: root, octave, root, fifth
    let baseFreq = chord.bass;
    if (beatInBar % 2 === 1) baseFreq *= 2; // octave bounce on off-beats

    const startSamp = Math.floor(e * eighth * SAMPLE_RATE);
    const numSamp = Math.floor(eighth * SAMPLE_RATE);

    for (let i = 0; i < numSamp && (startSamp + i) < totalSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.max(0, 1.0 - (t / eighth) * 0.7);
      bassPhase += baseFreq / SAMPLE_RATE;
      const tri = triangle(bassPhase);
      const pul = pulse(bassPhase, 0.5) * 0.4;
      out[startSamp + i] += (tri + pul) * env * 0.28;
    }
  }

  // Render Drums / Percussion (Chiptune Kick & Snare/Hat)
  for (let b = 0; b < totalBeats; b++) {
    const beatTime = b * beatSec;
    const isSnare = (b % 2 === 1); // beats 2 & 4
    const startSamp = Math.floor(beatTime * SAMPLE_RATE);

    if (isSnare) {
      // Snare: 8-bit noise burst + low tone
      const snareDur = 0.12;
      const numSamp = Math.floor(snareDur * SAMPLE_RATE);
      let snareTonePhase = 0;
      for (let i = 0; i < numSamp && (startSamp + i) < totalSamples; i++) {
        const t = i / SAMPLE_RATE;
        const env = Math.exp(-t * 30.0);
        snareTonePhase += 180 / SAMPLE_RATE;
        const n = retroNoise() * 0.18;
        const tone = triangle(snareTonePhase) * 0.1;
        out[startSamp + i] += (n + tone) * env;
      }
    } else {
      // Kick: frequency drop 140Hz -> 40Hz
      const kickDur = 0.12;
      const numSamp = Math.floor(kickDur * SAMPLE_RATE);
      let kickPhase = 0;
      for (let i = 0; i < numSamp && (startSamp + i) < totalSamples; i++) {
        const t = i / SAMPLE_RATE;
        const kFreq = Math.max(40, 140 * Math.exp(-t * 28.0));
        kickPhase += kFreq / SAMPLE_RATE;
        const env = Math.exp(-t * 22.0);
        out[startSamp + i] += triangle(kickPhase) * env * 0.35;
      }
    }

    // Hi-hat on 8th off-beat
    const hatTime = beatTime + (beatSec / 2);
    const hatSamp = Math.floor(hatTime * SAMPLE_RATE);
    const hatDur = 0.04;
    const hatNumSamp = Math.floor(hatDur * SAMPLE_RATE);
    for (let i = 0; i < hatNumSamp && (hatSamp + i) < totalSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 90.0);
      out[hatSamp + i] += retroNoise() * env * 0.09;
    }
  }

  return out;
}

// -------------------------------------------------------------
// 2. GENERATE START SOUND (Retro Arcade Ready / Coin Jingle)
// -------------------------------------------------------------
function generateStartSound() {
  const duration = 1.4;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(numSamples);

  // Quick ascending 8-bit fanfare arpeggio: C4 -> E4 -> G4 -> C5 -> E5 -> G5 -> C6
  const arpeggio = [
    { freq: NOTE.C4, dur: 0.06 },
    { freq: NOTE.E4, dur: 0.06 },
    { freq: NOTE.G4, dur: 0.06 },
    { freq: NOTE.C5, dur: 0.07 },
    { freq: NOTE.E5, dur: 0.07 },
    { freq: NOTE.G5, dur: 0.08 },
    { freq: NOTE.C6, dur: 0.45 },
  ];

  let time = 0;
  for (let idx = 0; idx < arpeggio.length; idx++) {
    const item = arpeggio[idx];
    const startSamp = Math.floor(time * SAMPLE_RATE);
    const countSamp = Math.floor(item.dur * SAMPLE_RATE);
    let phase = 0;
    let phaseHarmonic = 0;

    for (let i = 0; i < countSamp && (startSamp + i) < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env = idx === arpeggio.length - 1
        ? Math.exp(-t * 3.5) // ringing sustain on final note
        : Math.max(0, 1.0 - t / item.dur);
      phase += item.freq / SAMPLE_RATE;
      phaseHarmonic += (item.freq * 1.5) / SAMPLE_RATE;
      const val = (pulse(phase, 0.25) * 0.45 + pulse(phaseHarmonic, 0.5) * 0.2) * env;
      out[startSamp + i] += val;
    }
    time += item.dur;
  }

  // Final chime sparkle on top of the last note
  const chimeTime = time - 0.4;
  const chimeSamp = Math.floor(chimeTime * SAMPLE_RATE);
  let chimePhase = 0;
  for (let i = 0; i < Math.floor(0.4 * SAMPLE_RATE) && (chimeSamp + i) < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t * 8.0);
    chimePhase += (NOTE.E6 + Math.sin(t * 30) * 10) / SAMPLE_RATE;
    out[chimeSamp + i] += pulse(chimePhase, 0.5) * env * 0.25;
  }

  return out;
}

// -------------------------------------------------------------
// 3. GENERATE ERROR / ALERT SOUND (Classic Atari Harsh Buzzer)
// -------------------------------------------------------------
function generateErrorSound() {
  const duration = 0.38;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(numSamples);

  let phase1 = 0;
  let phase2 = 0;

  for (let i = 0; i < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    // Fast decay envelope with harsh transient
    const env = Math.exp(-t * 7.5);

    // Atari 2600 TIA dissonant dual-pulse buzz (~115 Hz + 126 Hz + harsh 60Hz hum)
    const freqDrop = Math.max(70, 130 - t * 120);
    const mod = Math.sin(2 * Math.PI * 60 * t) * 15;
    phase1 += (freqDrop + mod) / SAMPLE_RATE;
    phase2 += (freqDrop * 1.14 - mod) / SAMPLE_RATE;

    const p1 = pulse(phase1, 0.125); // thin harsh pulse
    const p2 = pulse(phase2, 0.25);
    const n = (i % 8 === 0) ? retroNoise() * 0.2 : 0; // bitcrush grit

    out[i] = (p1 * 0.4 + p2 * 0.4 + n) * env * 0.65;
  }

  return out;
}

// -------------------------------------------------------------
// 4. GENERATE WIN SOUND (Triumphant 8-Bit Victory Fanfare)
// -------------------------------------------------------------
function generateWinSound() {
  const duration = 3.2;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(numSamples);

  // Victory motif notes: [note, duration, chordBass]
  const fanfare = [
    { note: NOTE.G4, dur: 0.12, bass: NOTE.G2 },
    { note: NOTE.C5, dur: 0.12, bass: NOTE.C3 },
    { note: NOTE.E5, dur: 0.12, bass: NOTE.C3 },
    { note: NOTE.G5, dur: 0.26, bass: NOTE.G2 },
    { note: NOTE.E5, dur: 0.14, bass: NOTE.C3 },
    { note: NOTE.G5, dur: 0.50, bass: NOTE.C3 },
    // Flourish
    { note: NOTE.A5, dur: 0.14, bass: NOTE.F2 },
    { note: NOTE.B5, dur: 0.14, bass: NOTE.G2 },
    { note: NOTE.C6, dur: 1.20, bass: NOTE.C2 },
  ];

  let time = 0;
  for (let idx = 0; idx < fanfare.length; idx++) {
    const item = fanfare[idx];
    const startSamp = Math.floor(time * SAMPLE_RATE);
    const countSamp = Math.floor(item.dur * SAMPLE_RATE);
    let leadPhase = 0;
    let harmPhase = 0;
    let bassPhase = 0;

    for (let i = 0; i < countSamp && (startSamp + i) < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      const isLast = (idx === fanfare.length - 1);
      const env = isLast ? Math.exp(-t * 2.2) : Math.max(0, 1.0 - (t / item.dur) * 0.3);
      const vib = (isLast && t > 0.2) ? Math.sin(2 * Math.PI * 6.5 * (t - 0.2)) * 8 : 0;

      leadPhase += (item.note + vib) / SAMPLE_RATE;
      harmPhase += (item.note * 0.5) / SAMPLE_RATE; // lower sub-octave
      bassPhase += item.bass / SAMPLE_RATE;

      const lead = pulse(leadPhase, 0.25) * 0.38;
      const harm = pulse(harmPhase, 0.5) * 0.18;
      const bass = triangle(bassPhase) * 0.32;

      out[startSamp + i] += (lead + harm + bass) * env;
    }
    time += item.dur;
  }

  // Final sparkling retro arpeggios over the last chord (C-E-G-C shimmer)
  const shimmerStart = time - 1.1;
  const shimmerSamp = Math.floor(shimmerStart * SAMPLE_RATE);
  const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6, NOTE.G6];
  let sPhase = 0;
  for (let i = 0; i < Math.floor(1.0 * SAMPLE_RATE) && (shimmerSamp + i) < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const noteIdx = Math.floor(t * 18) % notes.length;
    const env = Math.exp(-t * 2.5);
    sPhase += notes[noteIdx] / SAMPLE_RATE;
    out[shimmerSamp + i] += pulse(sPhase, 0.5) * env * 0.12;
  }

  return out;
}

// -------------------------------------------------------------
// 5. GENERATE GAME OVER SOUND (Atari Defeat / Sad Slide Down)
// -------------------------------------------------------------
function generateGameOverSound() {
  const duration = 2.4;
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  const out = new Float32Array(numSamples);

  // Descending sad steps: Eb4 -> D4 -> Db4 -> C4 followed by deep pitch slide down to 40Hz
  const steps = [
    { freq: NOTE.Eb4, dur: 0.28 },
    { freq: NOTE.D4,  dur: 0.28 },
    { freq: NOTE.Db4, dur: 0.28 },
    { freq: NOTE.C4,  dur: 0.40 },
  ];

  let time = 0;
  for (const step of steps) {
    const startSamp = Math.floor(time * SAMPLE_RATE);
    const countSamp = Math.floor(step.dur * SAMPLE_RATE);
    let phase = 0;

    for (let i = 0; i < countSamp && (startSamp + i) < numSamples; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.max(0, 1.0 - (t / step.dur) * 0.4);
      const vib = Math.sin(2 * Math.PI * 5.5 * t) * 4;
      phase += (step.freq + vib) / SAMPLE_RATE;
      const val = pulse(phase, 0.25) * env * 0.35;
      out[startSamp + i] += val;
    }
    time += step.dur;
  }

  // Long dying slide down into low Atari buzz
  const slideStart = time;
  const slideSamp = Math.floor(slideStart * SAMPLE_RATE);
  const slideDur = duration - slideStart;
  const slideNumSamp = Math.floor(slideDur * SAMPLE_RATE);
  let slidePhase = 0;
  let noisePhase = 0;

  for (let i = 0; i < slideNumSamp && (slideSamp + i) < numSamples; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / slideDur;
    const freq = Math.max(35, NOTE.C4 * Math.exp(-progress * 2.8));
    slidePhase += freq / SAMPLE_RATE;
    noisePhase += (freq * 0.5) / SAMPLE_RATE;

    const env = Math.exp(-progress * 2.6);
    const p = pulse(slidePhase, 0.125) * 0.35;
    const thud = triangle(noisePhase) * 0.25;
    const n = (i % 6 === 0) ? retroNoise() * 0.12 : 0;

    out[slideSamp + i] += (p + thud + n) * env * 0.7;
  }

  return out;
}

// -------------------------------------------------------------
// MAIN EXECUTION
// -------------------------------------------------------------
const soundsDir = path.join(__dirname, "..", "sounds");
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

console.log("Generating 8-Bit Retro Atari sounds...");
writeWavFile(path.join(soundsDir, "theme.wav"), generateTheme());
writeWavFile(path.join(soundsDir, "start.wav"), generateStartSound());
writeWavFile(path.join(soundsDir, "error.wav"), generateErrorSound());
writeWavFile(path.join(soundsDir, "win.wav"), generateWinSound());
writeWavFile(path.join(soundsDir, "gameover.wav"), generateGameOverSound());
console.log("All audio files generated successfully in sounds/!");

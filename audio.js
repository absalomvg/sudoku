/**
 * ArcadeAudio - Retro 8-bit Atari Sound & Music Engine
 * Handles background chiptune music and retro sound effects:
 * - Retro Atari Chiptune Theme (BGM loop)
 * - Start Game Jingle
 * - Error / Alert Buzzer
 * - Win Fanfare
 * - Game Over Sound
 * - Cell Input Blips
 *
 * Dual-mode system:
 * 1. Plays generated 8-bit PCM WAV assets from sounds/ directory
 * 2. Automatic Web Audio API real-time synthesizer fallback for 100% offline file:/// compatibility
 */
(function (global) {
  "use strict";

  let audioCtx = null;
  let isMuted = false;
  let isPlayingTheme = false;
  let themeIntervalId = null;
  let activeSynthNodes = [];

  // Audio asset paths
  const SOUND_PATHS = {
    theme: "sounds/theme.wav",
    start: "sounds/start.wav",
    error: "sounds/error.wav",
    win: "sounds/win.wav",
    gameover: "sounds/gameover.wav",
  };

  const audioElements = {};
  let useAudioFiles = true;

  try {
    const savedMute = localStorage.getItem("sudoku_arcade_muted");
    if (savedMute !== null) {
      isMuted = savedMute === "true";
    }
  } catch (e) {}

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function initAudioElements() {
    Object.keys(SOUND_PATHS).forEach((key) => {
      const el = new Audio();
      el.src = SOUND_PATHS[key];
      el.preload = "auto";
      if (key === "theme") {
        el.loop = true;
        el.volume = 0.35;
      } else {
        el.volume = 0.65;
      }
      el.addEventListener("error", () => {
        // Fall back to synthesis if file path or CORS fails
        if (key === "theme") useAudioFiles = false;
      });
      audioElements[key] = el;
    });
  }

  // ==========================================
  // REAL-TIME SYNTHESIS FALLBACKS (Web Audio API)
  // ==========================================

  function synthBlip() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.06);
  }

  function synthStart() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const startTime = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
    const dur = 0.07;

    notes.forEach((freq, idx) => {
      const t = startTime + idx * dur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.setValueAtTime(freq, t);

      const noteDur = (idx === notes.length - 1) ? 0.45 : dur;
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDur + 0.02);
    });
  }

  function synthError() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sawtooth";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(125, now);
    osc1.frequency.linearRampToValueAtTime(70, now + 0.32);

    osc2.frequency.setValueAtTime(136, now);
    osc2.frequency.linearRampToValueAtTime(80, now + 0.32);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.33);
    osc2.stop(now + 0.33);
  }

  function synthWin() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const fanfare = [
      { f: 392.00, d: 0.12 },
      { f: 523.25, d: 0.12 },
      { f: 659.25, d: 0.12 },
      { f: 783.99, d: 0.28 },
      { f: 659.25, d: 0.14 },
      { f: 783.99, d: 0.50 },
      { f: 880.00, d: 0.14 },
      { f: 987.77, d: 0.14 },
      { f: 1046.50, d: 1.20 }
    ];

    let t = now;
    fanfare.forEach((item, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.frequency.setValueAtTime(item.f, t);

      const isLast = (idx === fanfare.length - 1);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + item.d);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + item.d + 0.05);

      t += item.d;
    });
  }

  function synthGameOver() {
    if (isMuted) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const steps = [311.13, 293.66, 277.18, 261.63];
    const dur = 0.26;

    steps.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = now + idx * dur;

      osc.type = "square";
      osc.frequency.setValueAtTime(f, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    });

    const slideTime = now + steps.length * dur;
    const slideOsc = ctx.createOscillator();
    const slideGain = ctx.createGain();

    slideOsc.type = "sawtooth";
    slideOsc.frequency.setValueAtTime(261.63, slideTime);
    slideOsc.frequency.exponentialRampToValueAtTime(36, slideTime + 1.2);

    slideGain.gain.setValueAtTime(0.24, slideTime);
    slideGain.gain.exponentialRampToValueAtTime(0.001, slideTime + 1.2);

    slideOsc.connect(slideGain);
    slideGain.connect(ctx.destination);
    slideOsc.start(slideTime);
    slideOsc.stop(slideTime + 1.25);
  }

  // Real-time Chiptune Synth Sequencer Loop (fallback when WAV cannot load)
  function playSynthThemeLoop() {
    stopSynthTheme();
    const ctx = getAudioContext();
    if (!ctx || isMuted || !isPlayingTheme) return;

    const BPM = 132;
    const beatSec = 60 / BPM;
    const sixteenth = beatSec / 4;
    const bars = 8;
    const loopDuration = bars * 4 * beatSec;

    function scheduleLoop(startTime) {
      if (!isPlayingTheme || isMuted) return;

      const chords = [
        { arp: [220.00, 261.63, 329.63, 440.00], bass: 110.00 },
        { arp: [220.00, 261.63, 329.63, 440.00], bass: 110.00 },
        { arp: [174.61, 220.00, 261.63, 349.23], bass: 87.31 },
        { arp: [174.61, 220.00, 261.63, 349.23], bass: 87.31 },
        { arp: [130.81, 164.81, 196.00, 261.63], bass: 65.41 },
        { arp: [130.81, 164.81, 196.00, 261.63], bass: 65.41 },
        { arp: [196.00, 246.94, 293.66, 392.00], bass: 98.00 },
        { arp: [196.00, 246.94, 293.66, 392.00], bass: 98.00 },
      ];

      const melody = [
        [659.25, 4], [523.25, 2], [587.33, 2], [659.25, 4], [440.00, 4],
        [493.88, 2], [523.25, 2], [587.33, 4], [659.25, 4], [523.25, 4],
        [880.00, 4], [698.46, 2], [783.99, 2], [880.00, 4], [523.25, 4],
        [587.33, 2], [659.25, 2], [698.46, 4], [783.99, 4], [659.25, 4],
        [783.99, 4], [659.25, 2], [698.46, 2], [783.99, 4], [523.25, 4],
        [587.33, 2], [659.25, 2], [698.46, 2], [783.99, 2], [880.00, 4], [987.77, 4],
        [987.77, 4], [783.99, 2], [880.00, 2], [987.77, 4], [1174.66, 4],
        [1318.51, 2], [1174.66, 2], [1046.50, 2], [987.77, 2], [880.00, 4]
      ];

      // Schedule melody
      let mTime = startTime;
      melody.forEach(([freq, len]) => {
        const dur = len * sixteenth;
        if (freq > 0) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "square";
          osc.frequency.setValueAtTime(freq, mTime);

          gain.gain.setValueAtTime(0.08, mTime);
          gain.gain.exponentialRampToValueAtTime(0.001, mTime + dur * 0.95);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(mTime);
          osc.stop(mTime + dur);
          activeSynthNodes.push(osc);
        }
        mTime += dur;
      });

      // Schedule arpeggios & bass
      for (let s = 0; s < bars * 16; s++) {
        const bar = Math.floor(s / 16);
        const chord = chords[bar % chords.length];
        const t = startTime + s * sixteenth;

        // Arp
        const arpFreq = chord.arp[s % chord.arp.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(arpFreq, t);
        gain.gain.setValueAtTime(0.04, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + sixteenth);
        activeSynthNodes.push(osc);

        // Bass on 8th notes
        if (s % 2 === 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          const isOff = (s % 4 === 2);
          const bFreq = isOff ? chord.bass * 2 : chord.bass;
          bassOsc.type = "triangle";
          bassOsc.frequency.setValueAtTime(bFreq, t);
          bassGain.gain.setValueAtTime(0.12, t);
          bassGain.gain.exponentialRampToValueAtTime(0.001, t + sixteenth * 1.8);
          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start(t);
          bassOsc.stop(t + sixteenth * 2);
          activeSynthNodes.push(bassOsc);
        }
      }
    }

    const start = ctx.currentTime + 0.05;
    scheduleLoop(start);
    themeIntervalId = setInterval(() => {
      if (isPlayingTheme && !isMuted) {
        scheduleLoop(ctx.currentTime + 0.05);
      }
    }, loopDuration * 1000);
  }

  function stopSynthTheme() {
    if (themeIntervalId) {
      clearInterval(themeIntervalId);
      themeIntervalId = null;
    }
    activeSynthNodes.forEach((node) => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {}
    });
    activeSynthNodes = [];
  }

  // ==========================================
  // PLAYBACK DISPATCHER
  // ==========================================

  function playSound(type) {
    if (isMuted) return;
    getAudioContext();

    if (useAudioFiles && audioElements[type]) {
      try {
        const audio = audioElements[type].cloneNode();
        audio.volume = 0.65;
        const promise = audio.play();
        if (promise !== undefined) {
          promise.catch(() => playSynth(type));
        }
        return;
      } catch (err) {
        playSynth(type);
      }
    } else {
      playSynth(type);
    }
  }

  function playSynth(type) {
    switch (type) {
      case "start":
        synthStart();
        break;
      case "error":
        synthError();
        break;
      case "win":
        synthWin();
        break;
      case "gameover":
        synthGameOver();
        break;
      default:
        synthBlip();
        break;
    }
  }

  function playTheme() {
    isPlayingTheme = true;
    if (isMuted) return;
    getAudioContext();

    const bgm = audioElements["theme"];
    if (useAudioFiles && bgm) {
      bgm.currentTime = 0;
      const promise = bgm.play();
      if (promise !== undefined) {
        promise.catch(() => {
          // If WAV file playback failed (CORS/autoplay), fallback to Web Audio Synth
          playSynthThemeLoop();
        });
      }
    } else {
      playSynthThemeLoop();
    }
  }

  function stopTheme() {
    isPlayingTheme = false;
    const bgm = audioElements["theme"];
    if (bgm) {
      bgm.pause();
      bgm.currentTime = 0;
    }
    stopSynthTheme();
  }

  function toggleMute() {
    isMuted = !isMuted;
    try {
      localStorage.setItem("sudoku_arcade_muted", String(isMuted));
    } catch (e) {}

    const bgm = audioElements["theme"];
    if (isMuted) {
      if (bgm) bgm.pause();
      stopSynthTheme();
    } else {
      if (isPlayingTheme) {
        playTheme();
      }
    }
    return isMuted;
  }

  // Unlock audio context on user interaction
  function unlock() {
    getAudioContext();
    if (isPlayingTheme && !isMuted) {
      const bgm = audioElements["theme"];
      if (bgm && bgm.paused && useAudioFiles) {
        bgm.play().catch(() => playSynthThemeLoop());
      }
    }
  }

  window.addEventListener("click", unlock, { once: false });
  window.addEventListener("keydown", unlock, { once: false });

  initAudioElements();

  global.ArcadeAudio = {
    init: function () {
      getAudioContext();
    },
    playTheme: playTheme,
    stopTheme: stopTheme,
    playStart: function () {
      playSound("start");
    },
    playError: function () {
      playSound("error");
    },
    playWin: function () {
      stopTheme();
      playSound("win");
    },
    playGameOver: function () {
      stopTheme();
      playSound("gameover");
    },
    playBlip: function () {
      synthBlip();
    },
    toggleMute: toggleMute,
    isMuted: function () {
      return isMuted;
    }
  };
})(window);

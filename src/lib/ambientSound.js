// Generative ambient soundscape built with the Web Audio API — no audio files.
//
//   drone     low, slowly shifting A–E tones: the hum of deep space
//   air       soft filtered noise, like distant solar wind
//   harmonics higher notes that open up as the flower blooms
//   chime     a soft bell the moment the flower opens
//
// In the Garden World it crossfades to the sea and birdsong (natureSound.js).
// Everything feeds a gentle echo so it feels spacious.

import { createNature } from "./natureSound";

const MASTER_VOLUME = 0.22;
const SCENE_FADE = 0.8; // time constant of the space ↔ garden crossfade (~2.5 s)
const LOOKAHEAD = 4; // seconds of waves and birds kept queued
const DRONE_NOTES = [55, 82.41, 110]; // A1, E2, A2
const BLOOM_NOTES = [164.81, 220, 329.63]; // E3, A3, E4
const CHIME_PARTIALS = [
  { frequency: 880, gain: 0.12 }, // A5
  { frequency: 1318.5, gain: 0.06 }, // E6
  { frequency: 1760, gain: 0.05 }, // A6
  { frequency: 2428.8, gain: 0.025 }, // bell-like inharmonic overtone
];

// Soft "pink" noise (Paul Kellet's economy filter).
function createNoiseBuffer(context) {
  const length = context.sampleRate * 4;
  const buffer = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;

    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
    }
  }

  return buffer;
}

// A very slow oscillator gently moving an audio parameter up and down.
function addDrift(context, param, rate, depth) {
  const lfo = context.createOscillator();
  const amount = context.createGain();
  lfo.frequency.value = rate;
  amount.gain.value = depth;
  lfo.connect(amount).connect(param);
  lfo.start();
}

export function createAmbience() {
  const context = new AudioContext();
  let suspendTimer = null;

  const master = context.createGain();
  master.gain.value = 0;
  master.connect(context.destination);

  // Two scenes, crossfaded: the space drone and the garden's sea and birds
  const spaceBus = context.createGain();
  const gardenBus = context.createGain();
  gardenBus.gain.value = 0;
  spaceBus.connect(master);
  gardenBus.connect(master);
  const gardenMeter = context.createAnalyser();
  gardenMeter.fftSize = 1024;
  gardenBus.connect(gardenMeter);
  const meterData = new Float32Array(gardenMeter.fftSize);
  let nature = null;
  let scene = null;
  let scheduler = null;
  let natureStopTimer = null;

  // Echo
  const echo = context.createDelay(2);
  const echoFeedback = context.createGain();
  const echoTone = context.createBiquadFilter();
  echo.delayTime.value = 0.42;
  echoFeedback.gain.value = 0.38;
  echoTone.type = "lowpass";
  echoTone.frequency.value = 1800;
  echo.connect(echoTone).connect(echoFeedback).connect(echo);
  echo.connect(master);

  // Drone
  const droneFilter = context.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.value = 300;
  droneFilter.Q.value = 0.7;
  droneFilter.connect(spaceBus);

  const droneGain = context.createGain();
  droneGain.gain.value = 0.5;
  droneGain.connect(droneFilter);

  DRONE_NOTES.forEach((frequency, i) => {
    ["sine", "triangle"].forEach((type, j) => {
      const oscillator = context.createOscillator();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      oscillator.detune.value = j === 0 ? -4 : 4;
      addDrift(context, oscillator.detune, 0.05 + i * 0.02, 6);
      oscillator.connect(droneGain);
      oscillator.start();
    });
  });

  // Bloom harmonics (silent until the flower forms)
  const harmonicGain = context.createGain();
  harmonicGain.gain.value = 0;
  harmonicGain.connect(droneFilter);
  harmonicGain.connect(echo);

  BLOOM_NOTES.forEach((frequency) => {
    const oscillator = context.createOscillator();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    oscillator.connect(harmonicGain);
    oscillator.start();
  });

  // Air
  const noise = context.createBufferSource();
  noise.buffer = createNoiseBuffer(context);
  noise.loop = true;

  const airFilter = context.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 700;
  airFilter.Q.value = 0.8;
  addDrift(context, airFilter.frequency, 0.04, 300);

  const airGain = context.createGain();
  airGain.gain.value = 0.08;

  noise.connect(airFilter).connect(airGain).connect(spaceBus);
  noise.start();

  return {
    start() {
      clearTimeout(suspendTimer);
      context.resume();
      master.gain.setTargetAtTime(MASTER_VOLUME, context.currentTime, 0.8);
    },

    stop() {
      master.gain.setTargetAtTime(0, context.currentTime, 0.3);
      clearTimeout(suspendTimer);
      suspendTimer = setTimeout(() => context.suspend(), 1500);
    },

    // bloom: 0 seed → 1 neural network → 2 flower
    update(bloom) {
      const now = context.currentTime;
      droneFilter.frequency.setTargetAtTime(300 + bloom * 450, now, 0.5);
      harmonicGain.gain.setTargetAtTime(Math.max(0, bloom - 1) * 0.18, now, 0.8);
      airGain.gain.setTargetAtTime(0.08 + bloom * 0.04, now, 0.8);
    },

    chime() {
      const now = context.currentTime;

      CHIME_PARTIALS.forEach(({ frequency, gain }) => {
        const oscillator = context.createOscillator();
        const envelope = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.value = frequency;
        envelope.gain.setValueAtTime(0, now);
        envelope.gain.linearRampToValueAtTime(gain, now + 0.02);
        envelope.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);
        oscillator.connect(envelope);
        envelope.connect(master);
        envelope.connect(echo);
        oscillator.start(now);
        oscillator.stop(now + 3.6);
      });
    },

    // "space" or "garden"; the first call switches at once, later ones crossfade
    setScene(next) {
      if (next === scene) return;
      const fade = scene === null ? 0.01 : SCENE_FADE;
      scene = next;
      const now = context.currentTime;
      spaceBus.gain.setTargetAtTime(next === "space" ? 1 : 0, now, fade);
      gardenBus.gain.setTargetAtTime(next === "garden" ? 1 : 0, now, fade);
      clearInterval(scheduler);
      clearTimeout(natureStopTimer);

      if (next === "garden") {
        if (!nature) nature = createNature(context, gardenBus, echo);
        nature.start(now);
        nature.scheduleUntil(now + LOOKAHEAD);
        scheduler = setInterval(() => nature.scheduleUntil(context.currentTime + LOOKAHEAD), 1000);
      } else if (nature) {
        // Let the queued waves fade out with the bus, then cancel the rest
        natureStopTimer = setTimeout(() => nature.stop(), SCENE_FADE * 5000);
      }
    },

    get scene() {
      return scene;
    },

    // How loud the garden is right now (0–1), for the oscilloscope
    gardenLevel() {
      gardenMeter.getFloatTimeDomainData(meterData);
      let sum = 0;
      for (const v of meterData) sum += v * v;
      return Math.min(1, Math.sqrt(sum / meterData.length) * 7);
    },

    close() {
      clearTimeout(suspendTimer);
      clearInterval(scheduler);
      clearTimeout(natureStopTimer);
      context.close();
    },
  };
}

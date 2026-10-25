// Soft synthesised sounds for "Land the Seed" (Web Audio, no files).
// Create on a user gesture (the Launch click); everything is quiet and short
// so it sits under the site's ambient soundscape.

const MASTER = 0.35;

export function createGameSound() {
  const context = new AudioContext();
  const master = context.createGain();
  master.gain.value = MASTER;
  master.connect(context.destination);

  // A shared noise buffer for the thrust hum and the crash
  const noise = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // A soft sine (or triangle) note with a gentle envelope
  function tone(frequency, { at = 0, length = 0.4, gain = 0.2, type = "sine", glideTo } = {}) {
    const start = context.currentTime + at;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (glideTo) oscillator.frequency.exponentialRampToValueAtTime(glideTo, start + length);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain, start + 0.015);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
    oscillator.connect(envelope).connect(master);
    oscillator.start(start);
    oscillator.stop(start + length + 0.05);
  }

  // Thrust: filtered noise, faded in and out as the key is held
  const thrustSource = context.createBufferSource();
  thrustSource.buffer = noise;
  thrustSource.loop = true;
  const thrustFilter = context.createBiquadFilter();
  thrustFilter.type = "lowpass";
  thrustFilter.frequency.value = 520;
  const thrustGain = context.createGain();
  thrustGain.gain.value = 0;
  thrustSource.connect(thrustFilter).connect(thrustGain).connect(master);
  thrustSource.start();

  // Parachute flutter: soft band-passed noise, gently wobbling while open
  const flutterSource = context.createBufferSource();
  flutterSource.buffer = noise;
  flutterSource.loop = true;
  const flutterFilter = context.createBiquadFilter();
  flutterFilter.type = "bandpass";
  flutterFilter.frequency.value = 900;
  flutterFilter.Q.value = 0.7;
  const flutterGain = context.createGain();
  flutterGain.gain.value = 0;
  const wobble = context.createOscillator();
  const wobbleDepth = context.createGain();
  wobble.frequency.value = 7;
  wobbleDepth.gain.value = 0;
  wobble.connect(wobbleDepth).connect(flutterGain.gain);
  wobble.start();
  flutterSource.connect(flutterFilter).connect(flutterGain).connect(master);
  flutterSource.start();

  let muted = false;

  return {
    setMuted(value) {
      muted = value;
      master.gain.setTargetAtTime(value ? 0 : MASTER, context.currentTime, 0.05);
    },
    resume() {
      if (!muted) context.resume();
    },
    suspend() {
      thrustGain.gain.setTargetAtTime(0, context.currentTime, 0.05);
      flutterGain.gain.setTargetAtTime(0, context.currentTime, 0.05);
      wobbleDepth.gain.setTargetAtTime(0, context.currentTime, 0.05);
      setTimeout(() => context.suspend(), 400);
    },
    launch() {
      tone(392, { length: 0.5, gain: 0.16 }); // G4
      tone(587.3, { at: 0.14, length: 0.7, gain: 0.14 }); // D5
    },
    thrust(on) {
      thrustGain.gain.setTargetAtTime(on ? 0.22 : 0, context.currentTime, on ? 0.06 : 0.1);
    },
    tick() {
      tone(1320, { length: 0.06, gain: 0.05, type: "triangle" });
    },
    landed() {
      [523.3, 659.3, 784, 1046.5].forEach((frequency, i) => tone(frequency, { at: i * 0.16, length: 1.2, gain: 0.13 }));
    },
    leaf() {
      tone(1760 + Math.random() * 400, { length: 0.35, gain: 0.025 });
    },
    crashed() {
      tone(110, { length: 0.6, gain: 0.28, glideTo: 55 });
      const burst = context.createBufferSource();
      burst.buffer = noise;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 700;
      const envelope = context.createGain();
      const now = context.currentTime;
      envelope.gain.setValueAtTime(0.25, now);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);
      burst.connect(filter).connect(envelope).connect(master);
      burst.start(now);
      burst.stop(now + 0.55);
    },
    // The canopy filling: a low "whump" of air, then a faint flutter
    chuteDeploy() {
      const now = context.currentTime;
      const burst = context.createBufferSource();
      burst.buffer = noise;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(250, now);
      filter.frequency.exponentialRampToValueAtTime(900, now + 0.6);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(0.3, now + 0.25);
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      burst.connect(filter).connect(envelope).connect(master);
      burst.start(now);
      burst.stop(now + 0.85);
      tone(147, { at: 0.18, length: 0.5, gain: 0.12 });
      flutterGain.gain.setTargetAtTime(0.025, now + 0.6, 0.3);
      wobbleDepth.gain.setTargetAtTime(0.015, now + 0.6, 0.3);
    },
    chuteOff() {
      flutterGain.gain.setTargetAtTime(0, context.currentTime, 0.2);
      wobbleDepth.gain.setTargetAtTime(0, context.currentTime, 0.2);
    },
    fuelEmpty() {
      tone(196, { length: 0.35, gain: 0.12, type: "triangle" });
    },
    close() {
      context.close();
    },
  };
}

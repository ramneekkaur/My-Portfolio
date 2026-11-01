// Generative sea-and-birdsong soundscape for the Garden World (Web Audio, no files).
//
//   bed    a very quiet, constant sea far away
//   waves  slow swells washing in and out, each with a soft foam hiss at its crest
//   breeze soft filtered noise, slowly changing in tone
//   birds  short, distant calls now and then, left or right
//
// Waves and birds are scheduled ahead on the audio clock (scheduleUntil), so the
// same code runs live and in an OfflineAudioContext.

const WAVE_EVERY = [8, 14]; // seconds between waves
const BIRD_EVERY = [6, 18]; // seconds between bird calls

const between = ([min, max]) => min + Math.random() * (max - min);

// Deep "brown" noise (integrated white noise): the rumble of water
function brownNoise(context, seconds) {
  const length = context.sampleRate * seconds;
  const buffer = context.createBuffer(2, length, context.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let last = 0;
    let peak = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last;
      peak = Math.max(peak, Math.abs(last));
    }
    for (let i = 0; i < length; i++) data[i] /= peak;
  }
  return buffer;
}

// Softer "pink" noise (Paul Kellet's economy filter): foam and air
function pinkNoise(context, seconds) {
  const length = context.sampleRate * seconds;
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

function drift(context, param, rate, depth) {
  const lfo = context.createOscillator();
  const amount = context.createGain();
  lfo.frequency.value = rate;
  amount.gain.value = depth;
  lfo.connect(amount).connect(param);
  lfo.start();
}

// Three bird calls: [start offset, length, from Hz, to Hz] per chirp
const CALLS = [
  // a quick twitter of rising chirps
  () => {
    const count = 2 + Math.floor(Math.random() * 4);
    return Array.from({ length: count }, (_, i) => [i * 0.12, 0.07, 2600, 4200]);
  },
  // a two-note whistle, down then up
  () => [
    [0, 0.18, 3100, 2450],
    [0.26, 0.2, 2450, 3300],
  ],
  // a light trill
  () => Array.from({ length: 6 }, (_, i) => [i * 0.055, 0.04, i % 2 ? 4300 : 3800, i % 2 ? 3900 : 4400]),
];

export function createNature(context, output, echo) {
  const brown = brownNoise(context, 6);
  const pink = pinkNoise(context, 4);
  let nextWave = 0;
  let nextBird = 0;
  let side = 1;
  let scheduled = []; // sources not yet finished, so stop() can cancel them

  // Constant, very quiet sea bed
  const bed = context.createBufferSource();
  bed.buffer = brown;
  bed.loop = true;
  const bedFilter = context.createBiquadFilter();
  bedFilter.type = "lowpass";
  bedFilter.frequency.value = 360;
  const bedGain = context.createGain();
  bedGain.gain.value = 0.09;
  bed.connect(bedFilter).connect(bedGain).connect(output);
  bed.start();

  // Breeze
  const air = context.createBufferSource();
  air.buffer = pink;
  air.loop = true;
  const airFilter = context.createBiquadFilter();
  airFilter.type = "bandpass";
  airFilter.frequency.value = 650;
  airFilter.Q.value = 0.6;
  drift(context, airFilter.frequency, 0.03, 250);
  const airGain = context.createGain();
  airGain.gain.value = 0.05;
  drift(context, airGain.gain, 0.05, 0.02);
  air.connect(airFilter).connect(airGain).connect(output);
  air.start();

  function track(source, end) {
    scheduled.push({ source, end });
    source.stop(end);
  }

  function wave(t) {
    const rise = between([3, 5]);
    const fall = between([4, 7]);
    const crest = t + rise;
    const end = crest + fall;
    const size = between([0.55, 0.85]);

    const pan = context.createStereoPanner();
    side = -side;
    pan.pan.value = side * between([0.15, 0.45]);
    pan.connect(output);

    // The body of the wave: rumbling water that brightens as it rises
    const water = context.createBufferSource();
    water.buffer = brown;
    water.loop = true;
    const tone = context.createBiquadFilter();
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(260, t);
    tone.frequency.linearRampToValueAtTime(between([900, 1300]), crest);
    tone.frequency.exponentialRampToValueAtTime(280, end);
    const body = context.createGain();
    body.gain.setValueAtTime(0, t);
    body.gain.linearRampToValueAtTime(size * 0.35, t + rise * 0.6);
    body.gain.linearRampToValueAtTime(size, crest);
    body.gain.setTargetAtTime(0, crest, fall / 3.5);
    water.connect(tone).connect(body).connect(pan);
    water.start(t, Math.random() * 5);
    track(water, end + 0.5);

    // Foam: a soft hiss as the wave breaks, then fizzing back out
    const fizz = context.createBufferSource();
    fizz.buffer = pink;
    fizz.loop = true;
    const foamTone = context.createBiquadFilter();
    foamTone.type = "bandpass";
    foamTone.frequency.value = between([2400, 3400]);
    foamTone.Q.value = 0.7;
    const foam = context.createGain();
    foam.gain.setValueAtTime(0, t);
    foam.gain.linearRampToValueAtTime(0, crest - 0.8);
    foam.gain.linearRampToValueAtTime(size * 0.5, crest + 0.2);
    foam.gain.setTargetAtTime(0, crest + 0.3, fall / 4);
    fizz.connect(foamTone).connect(foam).connect(pan);
    fizz.start(t, Math.random() * 3);
    track(fizz, end + 0.5);
  }

  function bird(t) {
    const pan = context.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.75;
    const level = context.createGain();
    level.gain.value = between([0.04, 0.065]);
    const send = context.createGain();
    send.gain.value = 0.5; // through the echo, so it sounds far away
    level.connect(pan).connect(output);
    level.connect(send).connect(echo);

    const shift = between([0.9, 1.12]); // each bird a little higher or lower
    for (const [offset, length, from, to] of CALLS[Math.floor(Math.random() * CALLS.length)]()) {
      const start = t + offset;
      const voice = context.createOscillator();
      voice.frequency.setValueAtTime(from * shift, start);
      voice.frequency.exponentialRampToValueAtTime(to * shift, start + length);
      const vibrato = context.createOscillator();
      const vibratoDepth = context.createGain();
      vibrato.frequency.value = 28;
      vibratoDepth.gain.value = 50;
      vibrato.connect(vibratoDepth).connect(voice.frequency);
      const envelope = context.createGain();
      envelope.gain.setValueAtTime(0, start);
      envelope.gain.linearRampToValueAtTime(1, start + 0.012);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + length);
      voice.connect(envelope).connect(level);
      voice.start(start);
      vibrato.start(start);
      track(voice, start + length + 0.05);
      track(vibrato, start + length + 0.05);
    }
  }

  return {
    // Begin (or resume) the waves and birds from this moment
    start(at) {
      nextWave = at + 0.3;
      nextBird = at + between([3, 7]);
    },
    // Queue every wave and bird call due before `time`
    scheduleUntil(time) {
      scheduled = scheduled.filter((s) => s.end > context.currentTime);
      while (nextWave < time) {
        wave(nextWave);
        nextWave += between(WAVE_EVERY);
      }
      while (nextBird < time) {
        bird(nextBird);
        nextBird += between(BIRD_EVERY);
      }
    },
    // Cancel everything still queued (the bed and breeze keep running, muted by the bus)
    stop() {
      for (const { source } of scheduled) {
        try {
          source.stop();
        } catch {
          // already stopped
        }
      }
      scheduled = [];
    },
  };
}

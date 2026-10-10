"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { createAmbience } from "@/lib/ambientSound";
import { useIntroStarted } from "@/lib/introState";
import { scrollState } from "@/lib/scrollState";

const UPDATE_INTERVAL_MS = 80;
const CHIME_AT = 1.9; // bloom value at which the flower counts as open
const REARM_BELOW = 1.4; // scroll back this far before it can chime again

// A sine wave over two periods, so sliding it by one period loops seamlessly.
function wavePath(period, amplitude, centre = 24) {
  const half = period / 2;
  let d = `M0 ${centre}`;
  for (let x = 0, i = 0; x < 48 + period * 2; x += half, i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    d += ` Q${x + half / 2} ${centre + direction * amplitude * 2} ${x + half} ${centre}`;
  }
  return d;
}

const WAVE_A = wavePath(16, 8);
const WAVE_B = wavePath(22, 6);

// Ambient sound switch: a small glass orb holding a waveform. Silent, it's a
// flat, still line; playing, the wave moves, swells as the flower blooms and
// the orb sends out slow ripples, like a signal broadcasting into space.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const ambience = useRef(null);
  const orbRef = useRef(null);
  const introStarted = useIntroStarted();

  useEffect(() => {
    if (!on) return;

    // Created on the first click, so the browser allows audio to play.
    if (!ambience.current) ambience.current = createAmbience();
    const sound = ambience.current;
    const orb = orbRef.current;
    sound.start();

    let armed = true;
    const timer = setInterval(() => {
      const bloom = scrollState.bloom;
      sound.update(bloom);
      orb.style.setProperty("--amp", (0.45 + bloom * 0.25).toFixed(2));

      if (armed && bloom > CHIME_AT) {
        sound.chime();
        armed = false;
      } else if (bloom < REARM_BELOW) {
        armed = true;
      }
    }, UPDATE_INTERVAL_MS);

    // Go quiet while the tab is in the background.
    const onVisibility = () => (document.hidden ? sound.stop() : sound.start());
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
      orb.style.removeProperty("--amp");
      sound.stop();
    };
  }, [on]);

  useEffect(() => () => ambience.current?.close(), []);

  return (
    <motion.button
      ref={orbRef}
      type="button"
      onClick={() => setOn((value) => !value)}
      aria-pressed={on}
      aria-label={on ? "Turn ambient sound off" : "Turn ambient sound on"}
      data-on={on}
      data-cursor="interactive"
      initial={{ opacity: 0 }}
      animate={introStarted ? { opacity: 1 } : undefined}
      transition={{ duration: 1.5, delay: 4.5 }}
      className="sound-orb group fixed bottom-6 right-6 z-[95] h-12 w-12 rounded-full bg-space/60 outline-none backdrop-blur-md"
    >
      <span aria-hidden="true" className="sound-orb-ripple" />
      <span aria-hidden="true" className="sound-orb-ripple sound-orb-ripple-late" />

      <svg aria-hidden="true" viewBox="0 0 48 48" className="relative h-full w-full">
        <defs>
          <clipPath id="sound-orb-clip">
            <circle cx="24" cy="24" r="16" />
          </clipPath>
          <radialGradient id="sound-orb-glass" cx="0.35" cy="0.3" r="0.8">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.02" />
          </radialGradient>
        </defs>

        <circle cx="24" cy="24" r="22.5" fill="url(#sound-orb-glass)" className="sound-orb-ring" />

        <g clipPath="url(#sound-orb-clip)">
          <g className="sound-wave-amp">
            <path d={WAVE_B} className="sound-wave sound-wave-b" />
          </g>
          <g className="sound-wave-amp">
            <path d={WAVE_A} className="sound-wave sound-wave-a" />
          </g>
        </g>
      </svg>

      <span className="sound-orb-label">{on ? "Sound on" : "Sound off"}</span>
    </motion.button>
  );
}

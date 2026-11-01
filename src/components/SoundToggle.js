"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
// The garden's sea. Real swells aren't sine waves: they have sharp crests and
// wide, flat troughs (a trochoid: x = t − k·sin t, y = −cos t). `surface` is
// the open line (for the foam), `fill` closes it far below so the water stays
// filled however much the waves are scaled. Spans two extra periods so the
// sideways roll loops seamlessly.
function seaPath(period, height, level, sharpness = 0.8) {
  const points = [];
  const step = (2 * Math.PI) / (period * 2.5);
  for (let t = 0; ; t += step) {
    const x = (period / (2 * Math.PI)) * (t - sharpness * Math.sin(t));
    points.push(`${x.toFixed(2)} ${(level - height * Math.cos(t)).toFixed(2)}`);
    if (x > 48 + period * 2) break;
  }
  const surface = `M${points.join(" L")}`;
  const end = points[points.length - 1].split(" ")[0];
  return { surface, fill: `${surface} L${end} 110 L0 110 Z` };
}

const SEA_BACK = seaPath(20, 2.6, 25.5);
const SEA_FRONT = seaPath(15, 3.4, 28);

// Ambient sound switch: a tiny oscilloscope screen. Silent, its trace is a
// flat, still line; playing, the wave moves, swells as the flower blooms (or,
// in the Garden World, with the waves) and the screen sends out slow ripples,
// like a signal broadcasting into space. In the Garden World the screen shows
// a little earth instead, its sea rolling with the waves you hear.
export default function SoundToggle() {
  const [on, setOn] = useState(false);
  const ambience = useRef(null);
  const orbRef = useRef(null);
  const introStarted = useIntroStarted();
  // The Garden World has its own soundscape: the sea and birdsong
  const scene = usePathname().startsWith("/garden") ? "garden" : "space";
  // Once shown, stay shown, also when returning from the garden to a home page
  // whose intro hasn't started (the garden has no intro to wait for)
  const [shown, setShown] = useState(false);
  if (!shown && (introStarted || scene === "garden")) setShown(true);

  useEffect(() => {
    if (!on) return;

    // Created on the first click, so the browser allows audio to play.
    if (!ambience.current) ambience.current = createAmbience();
    const sound = ambience.current;
    const orb = orbRef.current;
    sound.start();

    let armed = true;
    const timer = setInterval(() => {
      if (sound.scene === "garden") {
        orb.style.setProperty("--amp", (0.35 + sound.gardenLevel() * 0.5).toFixed(2));
        return;
      }
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

  // Runs after the effect above, so the sound exists by now
  useEffect(() => {
    if (on) ambience.current.setScene(scene);
  }, [on, scene]);

  useEffect(() => () => ambience.current?.close(), []);

  return (
    <motion.button
      ref={orbRef}
      type="button"
      onClick={() => setOn((value) => !value)}
      aria-pressed={on}
      aria-label={`Turn ${scene === "garden" ? "nature" : "ambient"} sound ${on ? "off" : "on"}`}
      data-on={on}
      data-scene={scene}
      data-cursor="interactive"
      initial={{ opacity: 0 }}
      animate={shown ? { opacity: 1 } : undefined}
      transition={{ duration: 1.5, delay: scene === "garden" ? 1 : 4.5 }}
      className="sound-orb group fixed bottom-6 right-6 z-[95] h-12 w-12 rounded-[3px] bg-space/80 outline-none backdrop-blur-md"
    >
      <span aria-hidden="true" className="sound-orb-ripple" />
      <span aria-hidden="true" className="sound-orb-ripple sound-orb-ripple-late" />

      <svg aria-hidden="true" viewBox="0 0 48 48" className="sound-face sound-face-space relative h-full w-full">
        <defs>
          <clipPath id="sound-orb-clip">
            <rect x="5" y="5" width="38" height="38" />
          </clipPath>
        </defs>

        {/* Screen bezel and measuring grid (graticule) */}
        <rect x="1.5" y="1.5" width="45" height="45" rx="2" fill="none" className="sound-orb-ring" />
        <g className="sound-orb-grid">
          {[13, 19, 29, 35].map((x) => (
            <line key={`v${x}`} x1={x} y1="5" x2={x} y2="43" />
          ))}
          {[14, 34].map((y) => (
            <line key={`h${y}`} x1="5" y1={y} x2="43" y2={y} />
          ))}
          <line x1="24" y1="5" x2="24" y2="43" className="sound-orb-axis" />
          <line x1="5" y1="24" x2="43" y2="24" className="sound-orb-axis" />
        </g>

        <g clipPath="url(#sound-orb-clip)">
          <g className="sound-wave-amp">
            <path d={WAVE_B} className="sound-wave sound-wave-b" />
          </g>
          <g className="sound-wave-amp">
            <path d={WAVE_A} className="sound-wave sound-wave-a" />
          </g>
        </g>
      </svg>

      {/* Garden World: a little earth with a rolling sea */}
      <svg aria-hidden="true" viewBox="0 0 48 48" className="sound-face sound-face-garden absolute inset-0 h-full w-full">
        <defs>
          <clipPath id="sound-earth-clip">
            <circle cx="24" cy="24" r="14.5" />
          </clipPath>
        </defs>
        <rect x="1.5" y="1.5" width="45" height="45" rx="2" fill="none" className="sound-orb-ring" />
        <circle cx="24" cy="24" r="15" className="sound-earth" />
        <ellipse cx="24" cy="24" rx="6" ry="15" className="sound-earth-meridian" />
        <g clipPath="url(#sound-earth-clip)">
          <g className="sound-sea-swell">
            {/* A darker, longer swell behind, and a lighter wave with foam in front */}
            <g className="sound-sea-amp sound-sea-amp-back">
              <path d={SEA_BACK.fill} className="sound-sea-roll sound-sea-back" />
            </g>
            <g className="sound-sea-amp sound-sea-amp-front">
              <g className="sound-sea-roll sound-sea-roll-front">
                <path d={SEA_FRONT.fill} className="sound-sea-front" />
                <path d={SEA_FRONT.surface} className="sound-sea-foam" />
              </g>
            </g>
          </g>
        </g>
      </svg>

      <span className="sound-orb-label">{on ? "Sound on" : "Sound off"}</span>
    </motion.button>
  );
}

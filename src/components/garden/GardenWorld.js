"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import Link from "next/link";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import * as THREE from "three";
import Planet from "./Planet";
import InterestPanel from "./InterestPanel";
import { latLonToVector } from "./planetShapes";
import Stars from "@/components/scene/Stars";
import { palette } from "@/lib/palette";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

const INTRO_SECONDS = 2.6; // the camera glides in from far away
const START_DISTANCE = 15;
const DISTANCE = 9.2; // room for the cloud puffs drifting around the world

// Glides the camera in on arrival, and turns it to face a selected interest.
function CameraDirector({ controls, target, reduceMotion }) {
  const born = useRef(null);
  const from = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const camera = state.camera;
    const t = state.clock.elapsedTime;
    if (born.current === null) born.current = t;

    // Narrow screens: pull back so the whole planet fits
    const fit = Math.min(1, state.viewport.aspect / 0.85);
    const distance = DISTANCE / fit;
    const intro = reduceMotion ? 1 : Math.min((t - born.current) / INTRO_SECONDS, 1);
    const eased = 1 - Math.pow(1 - intro, 3);
    const length = THREE.MathUtils.lerp(START_DISTANCE / fit, distance, eased);

    from.current.copy(camera.position).normalize();
    if (target) {
      // Turn smoothly towards the selected interest
      const k = reduceMotion ? 1 : 1 - Math.exp(-delta * 3);
      from.current.lerp(target, k).normalize();
    }
    camera.position.copy(from.current.multiplyScalar(length));
    controls.current?.update();
  });

  return null;
}

// The Garden World: a blossoming planet with an interest on every branch.
export default function GardenWorld({ interests, posts = [] }) {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduceMotion = usePrefersReducedMotion();
  const controls = useRef(null);
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);

  const target =
    selected === null
      ? null
      : new THREE.Vector3(...latLonToVector(interests[selected].lat, interests[selected].lon, 1)).normalize();

  const close = useCallback(() => setSelected(null), []);

  return (
    <section
      id="garden-world"
      aria-label="Garden World: my interests on a blossoming planet"
      className="relative h-[100svh] min-h-[560px] overflow-hidden"
    >
      {/* The planet slides aside on desktop when a story panel opens */}
      <div
        className={`absolute inset-0 transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          selected !== null ? "md:-translate-x-[14vw]" : ""
        }`}
      >
        <Canvas
          dpr={[1, 1.5]}
          camera={{ position: [3, 3, START_DISTANCE], fov: 45 }}
          gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
        >
          <fog attach="fog" args={[palette.space, 40, 140]} />
          <Suspense fallback={null}>
            <Stars count={isMobile ? 1000 : 2000} reduceMotion={reduceMotion} />
          </Suspense>
          <Planet
            interests={interests}
            blossomCount={isMobile ? 650 : 1300}
            reduceMotion={reduceMotion}
            hovered={hovered}
            selected={selected}
            onHover={setHovered}
            onSelect={setSelected}
          />
          <OrbitControls
            ref={controls}
            enablePan={false}
            enableZoom={false}
            enableDamping
            dampingFactor={0.08}
            rotateSpeed={0.5}
            autoRotate={!reduceMotion && selected === null && hovered === null}
            autoRotateSpeed={0.35}
            minPolarAngle={isMobile ? Math.PI / 2 - 0.25 : 0.45}
            maxPolarAngle={isMobile ? Math.PI / 2 + 0.25 : Math.PI - 0.45}
            onStart={() => setSelected(null)}
          />
          <CameraDirector controls={controls} target={target} reduceMotion={reduceMotion} />
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.7} luminanceThreshold={0.35} luminanceSmoothing={0.4} />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Title and wayfinding */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between p-5 md:p-8">
        <Link href="/#nature" className="btn-terminal pointer-events-auto">
          ← Return to orbit
        </Link>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-24 text-center md:pb-12">
        <p className="term-label" data-tone="nature">
          Beyond the code
        </p>
        <h1 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide md:text-5xl glow-text">
          Garden World
        </h1>
        <p className="mt-3 text-xs uppercase tracking-[0.3em] text-gray-400">
          {isMobile ? "Swipe to turn · tap a blossom" : "Drag to turn · select a blossom"}
        </p>
      </div>

      <InterestPanel interests={interests} posts={posts} selected={selected} onSelect={setSelected} onClose={close} />

      <div aria-hidden="true" className="garden-vignette pointer-events-none absolute inset-0 z-10" />
      <span className="sr-only" aria-live="polite">
        {selected !== null ? `Showing ${interests[selected].title}` : ""}
      </span>
    </section>
  );
}

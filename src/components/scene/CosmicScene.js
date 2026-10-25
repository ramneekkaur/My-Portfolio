"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  ColorDepth,
  EffectComposer,
  Noise,
  Pixelation,
  Vignette,
} from "@react-three/postprocessing";
import { Vector2 } from "three";
import Stars from "./Stars";
import SeedBloom from "./SeedBloom";
import { palette } from "@/lib/palette";
import { scrollState } from "@/lib/scrollState";
import { warpAmount } from "@/lib/warpState";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

const CAMERA_START_Z = 20;
const CAMERA_TRAVEL = 4; // how far the camera drifts forward over the whole page
const CAMERA_FOV = 75;
const WARP_DIVE = 22; // how far the camera dives forward when warping into a star
const WARP_FOV = 110; // the view widens so the stars rush past

// Old-monitor look: a fine low-resolution grain, a slightly reduced palette
// and colour fringing at the edges — subtle, so glows stay cinematic.
const PIXEL_SIZE = { desktop: 2, mobile: 2 };
const COLOR_BITS = 7;
const FRINGE_OFFSET = new Vector2(0.0015, 0.001);

// Gently moves the camera deeper into space as the visitor scrolls, and
// dives through the stars when a project is opened (lib/warpState.js).
function CameraRig() {
  useFrame(({ camera }) => {
    const warp = warpAmount(performance.now());
    camera.position.z = CAMERA_START_Z - scrollState.progress * CAMERA_TRAVEL - warp * WARP_DIVE;
    const fov = CAMERA_FOV + warp * (WARP_FOV - CAMERA_FOV);
    if (camera.fov !== fov) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}

// With frameloop="demand" nothing renders by itself, so redraw on scroll.
// Two frames: scroll-linked values (framer-motion) settle one frame later.
function RenderOnScroll() {
  const invalidate = useThree((state) => state.invalidate);

  useEffect(() => {
    const redraw = () => invalidate(2);
    window.addEventListener("scroll", redraw, { passive: true });
    window.addEventListener("resize", redraw);
    return () => {
      window.removeEventListener("scroll", redraw);
      window.removeEventListener("resize", redraw);
    };
  }, [invalidate]);

  return null;
}

// The one persistent 3D layer behind the whole page. Every section's 3D
// visuals (seed, neural network, flower, …) live here and react to scroll.
export default function CosmicScene() {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const reduceMotion = usePrefersReducedMotion();

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, CAMERA_START_Z], fov: CAMERA_FOV }}
        // Reduced motion: only redraw when the visitor scrolls.
        frameloop={reduceMotion ? "demand" : "always"}
        gl={{ alpha: false, antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={[palette.space]} />
        <fog attach="fog" args={[palette.space, 50, 250]} />
        <CameraRig />
        {reduceMotion && <RenderOnScroll />}
        <SeedBloom count={isMobile ? 1400 : 2600} reduceMotion={reduceMotion} />
        <Suspense fallback={null}>
          <Stars count={isMobile ? 1500 : 3000} reduceMotion={reduceMotion} />
        </Suspense>

        {/* The scene as seen on an old CRT monitor: phosphor bloom, chunky
            pixels, a reduced colour palette, colour fringing towards the edges,
            faint signal static and a dark tube vignette. */}
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.3} luminanceSmoothing={0.35} />
          <Pixelation granularity={isMobile ? PIXEL_SIZE.mobile : PIXEL_SIZE.desktop} />
          <ColorDepth bits={COLOR_BITS} />
          <ChromaticAberration offset={FRINGE_OFFSET} radialModulation modulationOffset={0.3} />
          <Noise premultiply opacity={0.5} />
          <Vignette offset={0.32} darkness={0.85} />
        </EffectComposer>
      </Canvas>

      {/* Banded nebula glow, a phosphor tint and the curved glass of the
          tube — all under the page content, so text stays crisp. */}
      <div className="cosmic-glow absolute inset-0" />
      <div className="crt-tint absolute inset-0" />
      <div className="crt-screen absolute inset-0" />
    </div>
  );
}

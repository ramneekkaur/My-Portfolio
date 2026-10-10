"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import Stars from "./Stars";
import SeedBloom from "./SeedBloom";
import { palette } from "@/lib/palette";
import { scrollState } from "@/lib/scrollState";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

const CAMERA_START_Z = 20;
const CAMERA_TRAVEL = 4; // how far the camera drifts forward over the whole page

// Gently moves the camera deeper into space as the visitor scrolls.
function CameraRig() {
  useFrame(({ camera }) => {
    camera.position.z = CAMERA_START_Z - scrollState.progress * CAMERA_TRAVEL;
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
        camera={{ position: [0, 0, CAMERA_START_Z], fov: 75 }}
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

        {/* Film look: light blooms softly off the seed, flower and brightest
            stars, and the frame darkens towards its edges. */}
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.3} luminanceSmoothing={0.35} />
          <Vignette offset={0.28} darkness={0.7} />
        </EffectComposer>
      </Canvas>

      {/* Faint nebula glow, screened over the scene */}
      <div className="cosmic-glow absolute inset-0" />
    </div>
  );
}

"use client";

import { useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import * as THREE from "three";
import { palette } from "@/lib/palette";
import { mulberry32 } from "@/lib/random";
import { scrollState } from "@/lib/scrollState";

// How far the sky rises over the whole page. The page content moves much
// further, so the stars feel distant (parallax depth).
const PARALLAX_DISTANCE = 12;

// The camera sits ~20 units from the centre; keep stars well beyond it.
const MIN_RADIUS = 32;
const MAX_RADIUS = 75;

function createStars(count) {
  const random = mulberry32(2209);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let i = 0; i < count; i++) {
    // Position: a spherical shell, so no star ever drifts close enough to
    // the camera to render as a huge blurry disc
    const radius = MIN_RADIUS + random() * (MAX_RADIUS - MIN_RADIUS);
    const z = random() * 2 - 1;
    const angle = random() * Math.PI * 2;
    const ring = Math.sqrt(1 - z * z) * radius;
    positions[i * 3] = Math.cos(angle) * ring;
    positions[i * 3 + 1] = Math.sin(angle) * ring;
    positions[i * 3 + 2] = z * radius;

    // Color variation
    const mix = random();

    if (mix < 0.8) {
      color.set("#ffffff"); // mostly white
    } else if (mix < 0.95) {
      color.set(palette.electric); // soft blue
    } else {
      color.set(palette.nebula); // subtle violet
    }

    const intensity = random() * 0.6 + 0.2; // dimmer than the hero, so it stays the focus

    colors[i * 3] = color.r * intensity;
    colors[i * 3 + 1] = color.g * intensity;
    colors[i * 3 + 2] = color.b * intensity;
  }

  return { positions, colors };
}

export default function Stars({ count, reduceMotion }) {
  const ref = useRef();
  const texture = useLoader(THREE.TextureLoader, "/textures/glow.png");
  const { positions, colors } = useMemo(() => createStars(count), [count]);

  useFrame((state, delta) => {
    const stars = ref.current;

    // Slow ambient drift
    if (!reduceMotion) {
      stars.rotation.x -= delta / 20;
      stars.rotation.y -= delta / 25;
    }

    // Scroll parallax (already smoothed by Lenis)
    stars.position.y = scrollState.progress * PARALLAX_DISTANCE;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} colors={colors} stride={3}>
        <PointMaterial
          transparent
          map={texture}
          vertexColors
          size={0.35}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

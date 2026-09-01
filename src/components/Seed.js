"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export default function Seed() {
  const seedRef = useRef();
  const glowRef = useRef();
  const outerGlowRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const pulse = 1 + Math.sin(t * 1.6) * 0.08;
    const glowPulse = 1.2 + Math.sin(t * 1.3) * 0.15;

    seedRef.current.scale.set(pulse, pulse, pulse);
    glowRef.current.scale.set(glowPulse, glowPulse, glowPulse);
    outerGlowRef.current.scale.set(glowPulse * 1.4, glowPulse * 1.4, glowPulse * 1.4);
  });

  return (
    <group>
      {/* Outer soft glow */}
      <mesh ref={outerGlowRef}>
        <sphereGeometry args={[1.4, 32, 32]} />
        <meshBasicMaterial
          color="#60a5fa"
          transparent
          opacity={0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial
          color="#8ab4f8"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Core seed */}
      <mesh ref={seedRef}>
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshBasicMaterial color="#e0f2fe" toneMapped={false} />
      </mesh>
    </group>
  );
}
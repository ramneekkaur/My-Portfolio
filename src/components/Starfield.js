"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useRef, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { TextureLoader } from "three";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";

function Stars(props) {
  const ref = useRef();

  const texture = useLoader(TextureLoader, "/Glow texture.png");

  const { positions, colors } = useMemo(() => {
  const positions = new Float32Array(5000 * 3);
  const colors = new Float32Array(5000 * 3);

  const color = new THREE.Color();

  for (let i = 0; i < 3000; i++) {
    // Position
    positions[i * 3] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 100;

    // Color variation
    const mix = Math.random();

    if (mix < 0.8) {
      color.set("#ffffff"); // mostly white
    } else if (mix < 0.95) {
      color.set("#60a5fa"); // soft blue
    } else {
      color.set("#a78bfa"); // subtle violet
    }

    const intensity = Math.random() * 0.8 + 0.2;

    colors[i * 3] = color.r * intensity;
    colors[i * 3 + 1] = color.g * intensity;
    colors[i * 3 + 2] = color.b * intensity;    
  }

  return { positions, colors };
}, []);

  useFrame((state, delta) => {
    ref.current.rotation.x -= delta / 20;
    ref.current.rotation.y -= delta / 25;
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={positions} colors={colors} stride={3}>
        <PointMaterial
          transparent
          map={texture}
          vertexColors
          size={0.15}
          sizeAttenuation
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </Points>
    </group>
  );
}

export default function Starfield() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
        <fog attach="fog" args={["#000000", 50, 250]} />
        <ambientLight intensity={0.5} />
        <Stars />
        
        
      </Canvas>
    </div>
  );
}
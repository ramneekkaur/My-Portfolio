"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createBloomShapes } from "./bloomShapes";
import { palette } from "@/lib/palette";
import { scrollState } from "@/lib/scrollState";
import { HERO } from "@/lib/heroTimeline";
import { mapRange } from "@/lib/math";
import { markIntroStarted } from "@/lib/introState";

const INTRO_DURATION = 3.2; // seconds for the dust to gather into the seed
const SEED_Y = 4; // the seed floats above the hero title
const BLOOM_Y = 1.2; // the network and flower sit near the centre
const GROWN_SCALE = 1.45; // the network and flower are larger than the seed
const REST_OPACITY = 0.05; // how faintly the flower lingers after the hero

const vertexShader = /* glsl */ `
  uniform float uMorph;   // 0 seed, 1 neural network, 2 flower
  uniform float uIntro;   // 0 scattered dust → 1 gathered seed
  uniform float uTime;
  uniform float uMotion;  // 0 when the visitor prefers reduced motion
  uniform float uSize;
  uniform float uPixelRatio;

  attribute vec3 aScatter;
  attribute vec3 aNetwork;
  attribute vec3 aFlower;
  attribute vec3 aColorSeed;
  attribute vec3 aColorNetwork;
  attribute vec3 aColorFlower;
  attribute float aRandom;
  attribute float aSize;

  varying vec3 vColor;
  varying float vAlpha;

  // Each particle starts its journey a little later than the last,
  // so shapes dissolve and re-form organically instead of all at once.
  float stagger(float t) {
    return smoothstep(0.0, 1.0, clamp((t - aRandom * 0.35) / 0.65, 0.0, 1.0));
  }

  void main() {
    float toNetwork = stagger(clamp(uMorph, 0.0, 1.0));
    float toFlower = stagger(clamp(uMorph - 1.0, 0.0, 1.0));

    vec3 pos = mix(mix(position, aNetwork, toNetwork), aFlower, toFlower);
    vec3 col = mix(mix(aColorSeed, aColorNetwork, toNetwork), aColorFlower, toFlower);

    vec3 drift = normalize(vec3(sin(aRandom * 91.0), cos(aRandom * 57.0), sin(aRandom * 33.0) + 0.01));

    // Particles billow outwards mid-journey, then settle into the new shape
    float travel = sin(toNetwork * 3.14159) + sin(toFlower * 3.14159);
    pos += drift * travel * 0.9;

    // Gentle breathing
    pos += drift * sin(uTime * 0.8 + aRandom * 6.2832) * 0.05 * uMotion;

    // Intro: far-away dust gathers into the seed
    float intro = clamp((uIntro - aRandom * 0.3) / 0.7, 0.0, 1.0);
    intro = 1.0 - pow(1.0 - intro, 3.0);
    pos = mix(aScatter, pos, intro);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float twinkle = 1.0 - 0.2 * uMotion * (0.5 + 0.5 * sin(uTime * 1.7 + aRandom * 40.0));
    gl_PointSize = min(uSize * aSize * twinkle * uPixelRatio / -mvPosition.z, 64.0);

    vColor = col;
    vAlpha = intro;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Soft round glow instead of a hard square point
    float glow = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor, pow(glow, 1.6) * vAlpha * uOpacity);
    #include <colorspace_fragment>
  }
`;

// The hero's "seed of intelligence": dust gathers into a glowing seed, which
// grows into a neural network and then blooms into a flower as you scroll.
export default function SeedBloom({ count, reduceMotion }) {
  const groupRef = useRef();
  const materialRef = useRef();
  const lineMaterialRef = useRef();
  const morph = useRef(0);
  const introStart = useRef(null);

  const shapes = useMemo(() => createBloomShapes(count), [count]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(shapes.seed, 3));
    g.setAttribute("aScatter", new THREE.BufferAttribute(shapes.scatter, 3));
    g.setAttribute("aNetwork", new THREE.BufferAttribute(shapes.network, 3));
    g.setAttribute("aFlower", new THREE.BufferAttribute(shapes.flower, 3));
    g.setAttribute("aColorSeed", new THREE.BufferAttribute(shapes.colorSeed, 3));
    g.setAttribute("aColorNetwork", new THREE.BufferAttribute(shapes.colorNetwork, 3));
    g.setAttribute("aColorFlower", new THREE.BufferAttribute(shapes.colorFlower, 3));
    g.setAttribute("aRandom", new THREE.BufferAttribute(shapes.randoms, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(shapes.sizes, 1));
    // Particles travel far during the intro; never cull them.
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 40);
    return g;
  }, [shapes]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({
      uMorph: { value: 0 },
      uIntro: { value: 0 },
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uSize: { value: 95 },
      uPixelRatio: { value: 1 },
      uOpacity: { value: 1 },
    }),
    []
  );

  useFrame((state, delta) => {
    const u = materialRef.current.uniforms;
    const t = state.clock.elapsedTime;
    const hero = scrollState.hero;

    // The intro starts on the first frame the seed is actually drawn
    if (introStart.current === null) {
      introStart.current = t;
      markIntroStarted();
    }

    // Scroll → shape: 0 seed, 1 network, 2 flower
    const target =
      mapRange(hero, HERO.networkStart, HERO.networkEnd) +
      mapRange(hero, HERO.flowerStart, HERO.flowerEnd);
    morph.current = reduceMotion
      ? target
      : THREE.MathUtils.damp(morph.current, target, 2.5, delta);
    const m = morph.current;
    scrollState.bloom = m; // the ambient sound follows the bloom

    // Once the hero scrolls away, the flower recedes into a faint presence
    const exit = mapRange(hero, HERO.exitStart, 1);
    const grown = Math.min(m, 1);

    u.uMorph.value = m;
    u.uIntro.value = reduceMotion ? 1 : Math.min((t - introStart.current) / INTRO_DURATION, 1);
    u.uTime.value = t;
    u.uMotion.value = reduceMotion ? 0 : 1;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    u.uOpacity.value = THREE.MathUtils.lerp(1, REST_OPACITY, exit);

    // Synapse lines glow only while the network is formed
    const networkAmount = mapRange(m, 0.6, 1) * (1 - mapRange(m, 1, 1.4));
    lineMaterialRef.current.opacity = networkAmount * 0.16 * u.uOpacity.value;

    const group = groupRef.current;
    const fitScale = Math.min(1, state.viewport.aspect / 0.8); // fit narrow screens
    const pulse = reduceMotion ? 1 : 1 + Math.sin(t * 1.6) * 0.05 * (1 - grown);
    const growth = THREE.MathUtils.lerp(1, GROWN_SCALE, grown);
    group.scale.setScalar(fitScale * growth * pulse);
    group.position.y = THREE.MathUtils.lerp(SEED_Y, BLOOM_Y, grown) + exit * 5;
    group.position.z = -exit * 6;
    group.rotation.y = reduceMotion ? 0 : Math.sin(t * 0.15) * 0.25;
  });

  return (
    <group ref={groupRef} position={[0, SEED_Y, 0]}>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shapes.edgeLines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={lineMaterialRef}
          color={palette.electric}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  );
}

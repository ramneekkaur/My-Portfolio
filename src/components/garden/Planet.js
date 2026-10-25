"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { PLANET_RADIUS, createCloudPuffs, createEdgeBlossoms, createGarden, latLonToVector } from "./planetShapes";
import { palette } from "@/lib/palette";

const GROW_SECONDS = 3.4; // branches draw in
const BLOOM_DELAY = 1.1; // blossoms start opening after this
const BLOOM_SECONDS = 3.8;
const EDGE_SHARE = 1.3; // edge blossoms, as a share of the branch blossoms

const color = (hex) => new THREE.Color(hex);

// ───── Planet body: soft dark-green sphere with a fresnel rim and atmosphere ─────
const bodyVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vNormal = normalize(normalMatrix * normal);
    vView = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const bodyFragment = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float fresnel = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.2);
    vec3 col = mix(uDeep, uRim, fresnel * 0.85);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;
const atmosphereFragment = /* glsl */ `
  uniform vec3 uRim;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    // Strongest at the planet's limb, fading to nothing at the shell's edge
    float glow = pow(clamp(abs(dot(vNormal, vView)) * 1.7, 0.0, 1.0), 3.0);
    gl_FragColor = vec4(uRim, glow * 0.32);
    #include <colorspace_fragment>
  }
`;

function PlanetBody() {
  const uniforms = useMemo(
    () => ({ uDeep: { value: color("#0b1f17") }, uRim: { value: color(palette.leaf) } }),
    []
  );
  return (
    <group>
      <mesh>
        <sphereGeometry args={[PLANET_RADIUS, 96, 96]} />
        <shaderMaterial uniforms={uniforms} vertexShader={bodyVertex} fragmentShader={bodyFragment} />
      </mesh>
      <mesh scale={1.12}>
        <sphereGeometry args={[PLANET_RADIUS, 64, 64]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={bodyVertex}
          fragmentShader={atmosphereFragment}
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// ───── Branches: fine green lines drawing themselves along the surface ─────
const branchVertex = /* glsl */ `
  attribute float aProgress;
  varying float vProgress;
  void main() {
    vProgress = aProgress;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const branchFragment = /* glsl */ `
  uniform float uGrow;
  uniform vec3 uColor;
  varying float vProgress;
  void main() {
    if (vProgress > uGrow) discard;
    float tip = smoothstep(uGrow - 0.05, uGrow, vProgress);
    gl_FragColor = vec4(mix(uColor, vec3(0.85, 1.0, 0.9), tip * 0.7), 0.75);
    #include <colorspace_fragment>
  }
`;

// ───── Blossoms: soft five-petal flowers drawn in the fragment shader ─────
const blossomVertex = /* glsl */ `
  uniform float uBloom;
  uniform float uTime;
  uniform float uMotion;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec3 uRose;
  uniform vec3 uPale;
  attribute float aDelay;
  attribute float aSize;
  attribute float aSeed;
  attribute float aMix;
  varying vec3 vColor;
  varying float vOpen;
  varying float vSeed;
  void main() {
    float open = smoothstep(aDelay, aDelay + 0.18, uBloom);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float breathe = 1.0 + 0.05 * sin(uTime * 0.7 + aSeed * 30.0) * uMotion;
    gl_PointSize = uSize * aSize * open * breathe * uPixelRatio / -mv.z;
    vColor = mix(uRose, uPale, aMix * 0.7);
    vOpen = open;
    vSeed = aSeed;
  }
`;
const blossomFragment = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vOpen;
  varying float vSeed;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float r = length(p) * 2.0;
    float a = atan(p.y, p.x) + vSeed * 6.2832;
    float petal = 0.5 + 0.5 * pow(abs(cos(a * 2.5)), 0.6); // five petals
    float shape = 1.0 - smoothstep(petal - 0.18, petal, r);
    float centre = 1.0 - smoothstep(0.0, 0.25, r);
    vec3 col = mix(vColor, vec3(1.0, 0.93, 0.82), centre * 0.85);
    float alpha = shape * vOpen * uOpacity;
    if (alpha < 0.02) discard;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

// The interests' own blossoms: larger, and the focused one grows and brightens
const featureVertex = blossomVertex
  .replace("attribute float aMix;", "attribute float aMix;\n  attribute float aIndex;\n  uniform float uFocus;")
  .replace(
    "gl_PointSize = uSize * aSize * open * breathe * uPixelRatio / -mv.z;",
    "float focus = 1.0 - step(0.5, abs(aIndex - uFocus));\n    gl_PointSize = uSize * aSize * open * breathe * (1.0 + focus * 0.45) * uPixelRatio / -mv.z;"
  )
  .replace("vColor = mix(uRose, uPale, aMix * 0.7);", "vColor = mix(uRose, uPale, aMix * 0.7 + focus * 0.35);");

// Edge blossoms: full size where the surface turns away at the planet's
// outline, shrinking to nothing on the face that looks at the camera
const edgeVertex = blossomVertex.replace(
  "gl_PointSize = uSize * aSize * open * breathe * uPixelRatio / -mv.z;",
  `vec3 normalView = normalize(normalMatrix * position);
    float edge = 1.0 - smoothstep(0.18, 0.4, abs(dot(normalView, normalize(-mv.xyz))));
    gl_PointSize = uSize * aSize * open * breathe * edge * uPixelRatio / -mv.z;
    if (edge < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // off screen, not even a pixel`
);

// ───── Drifting petals ─────
const petalVertex = /* glsl */ `
  uniform float uTime;
  uniform float uBloom;
  uniform float uPixelRatio;
  attribute vec3 aDrift;
  attribute float aOffset;
  varying float vAlpha;
  void main() {
    float t = fract(uTime * 0.035 + aOffset);
    vec3 pos = position + aDrift * t * 1.8;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = 30.0 * (1.0 - t * 0.6) * uPixelRatio / -mv.z;
    vAlpha = sin(t * 3.14159) * 0.75 * smoothstep(0.6, 1.0, uBloom);
  }
`;
const petalFragment = /* glsl */ `
  uniform vec3 uRose;
  varying float vAlpha;
  void main() {
    vec2 p = (gl_PointCoord - 0.5) * vec2(2.0, 3.2);
    float shape = 1.0 - smoothstep(0.7, 1.0, length(p));
    if (shape * vAlpha < 0.02) discard;
    gl_FragColor = vec4(uRose, shape * vAlpha);
    #include <colorspace_fragment>
  }
`;

// ───── Cloud puffs: soft clusters drifting around the world on tilted orbits ─────
const puffVertex = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute vec4 aOrbit;   // axis (xyz) + angular speed (w)
  attribute vec3 aStart;   // the puff's centre at time 0
  attribute float aSize;
  attribute float aSeed;

  vec3 rotateAround(vec3 v, vec3 k, float a) {
    return v * cos(a) + cross(k, v) * sin(a) + k * dot(k, v) * (1.0 - cos(a));
  }

  void main() {
    vec3 p = rotateAround(aStart + position, aOrbit.xyz, aOrbit.w * uTime);
    p += normalize(p) * sin(uTime * 0.4 + aSeed * 6.2832) * 0.05; // a gentle bob
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aSize * uPixelRatio / -mv.z;
  }
`;
const puffFragment = /* glsl */ `
  uniform vec3 uTint;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float soft = pow(1.0 - smoothstep(0.0, 1.0, r), 1.6); // a very soft edge, like vapour
    if (soft < 0.01) discard;
    vec3 col = mix(vec3(0.88), uTint, 0.35 + 0.35 * r);  // kept below white so the glow doesn't bloom
    gl_FragColor = vec4(col, soft * 0.26);
    #include <colorspace_fragment>
  }
`;

function CloudPuffs({ reduceMotion }) {
  const ref = useRef();
  const geometry = useMemo(() => {
    const puffs = createCloudPuffs();
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(puffs.offset, 3));
    g.setAttribute("aOrbit", new THREE.BufferAttribute(puffs.orbit, 4));
    g.setAttribute("aStart", new THREE.BufferAttribute(puffs.start, 3));
    g.setAttribute("aSize", new THREE.BufferAttribute(puffs.size, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(puffs.seed, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), PLANET_RADIUS * 2);
    return g;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 420 },
      uPixelRatio: { value: 1 },
      uTint: { value: color(palette.blossomLight) },
    }),
    []
  );

  useFrame((state) => {
    const u = ref.current.uniforms;
    u.uPixelRatio.value = state.gl.getPixelRatio();
    if (!reduceMotion) u.uTime.value = state.clock.elapsedTime;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={ref}
        uniforms={uniforms}
        vertexShader={puffVertex}
        fragmentShader={puffFragment}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

function attribute(array, size) {
  return new THREE.BufferAttribute(array, size);
}

// The blossoming planet: branches grow, blossoms open, petals drift, and every
// interest is a larger glowing blossom with a label you can select.
export default function Planet({ interests, blossomCount, reduceMotion, hovered, selected, onHover, onSelect }) {
  const anchors = useMemo(
    () => interests.map((interest) => latLonToVector(interest.lat, interest.lon, PLANET_RADIUS)),
    [interests]
  );
  const garden = useMemo(() => createGarden({ blossomCount, anchors }), [blossomCount, anchors]);

  const branchRef = useRef();
  const blossomRef = useRef();
  const edgeRef = useRef();
  const petalRef = useRef();
  const featureRef = useRef();
  const labelRefs = useRef([]);
  const startedAt = useRef(null);

  const geometries = useMemo(() => {
    const branches = new THREE.BufferGeometry();
    branches.setAttribute("position", attribute(garden.linePositions, 3));
    branches.setAttribute("aProgress", attribute(garden.lineProgress, 1));

    const blossoms = new THREE.BufferGeometry();
    const b = garden.blossoms;
    blossoms.setAttribute("position", attribute(b.positions, 3));
    blossoms.setAttribute("aDelay", attribute(b.delay, 1));
    blossoms.setAttribute("aSize", attribute(b.size, 1));
    blossoms.setAttribute("aSeed", attribute(b.seed, 1));
    blossoms.setAttribute("aMix", attribute(b.mix, 1));

    const edge = new THREE.BufferGeometry();
    const e = createEdgeBlossoms(Math.round(blossomCount * EDGE_SHARE));
    edge.setAttribute("position", attribute(e.positions, 3));
    edge.setAttribute("aDelay", attribute(e.delay, 1));
    edge.setAttribute("aSize", attribute(e.size, 1));
    edge.setAttribute("aSeed", attribute(e.seed, 1));
    edge.setAttribute("aMix", attribute(e.mix, 1));

    const petals = new THREE.BufferGeometry();
    petals.setAttribute("position", attribute(garden.petals.start, 3));
    petals.setAttribute("aDrift", attribute(garden.petals.drift, 3));
    petals.setAttribute("aOffset", attribute(garden.petals.offset, 1));

    // The interests' own blossoms: one larger flower at each anchor, slightly raised
    const features = new THREE.BufferGeometry();
    const raised = new Float32Array(anchors.length * 3);
    anchors.forEach((a, i) => raised.set(a.map((c) => c * 1.025), i * 3));
    features.setAttribute("position", attribute(raised, 3));
    features.setAttribute("aDelay", attribute(new Float32Array(anchors.length).fill(0.35), 1));
    features.setAttribute("aSize", attribute(new Float32Array(anchors.length).fill(3.2), 1));
    features.setAttribute("aSeed", attribute(new Float32Array(anchors.map((_, i) => i * 0.37)), 1));
    features.setAttribute("aMix", attribute(new Float32Array(anchors.length).fill(0.15), 1));
    features.setAttribute("aIndex", attribute(new Float32Array(anchors.map((_, i) => i)), 1));
    return { branches, blossoms, edge, petals, features };
  }, [garden, anchors, blossomCount]);

  useEffect(() => () => Object.values(geometries).forEach((g) => g.dispose()), [geometries]);

  const uniforms = useMemo(() => {
    const shared = {
      uBloom: { value: 0 },
      uTime: { value: 0 },
      uMotion: { value: 1 },
      uPixelRatio: { value: 1 },
      uRose: { value: color(palette.blossom) },
      uPale: { value: color(palette.blossomLight) },
    };
    return {
      branches: { uGrow: { value: 0 }, uColor: { value: color(palette.leaf) } },
      blossoms: { ...shared, uSize: { value: 52 }, uOpacity: { value: 0.92 } },
      petals: { uTime: shared.uTime, uBloom: shared.uBloom, uPixelRatio: shared.uPixelRatio, uRose: shared.uRose },
      features: { ...shared, uSize: { value: 52 }, uOpacity: { value: 1 }, uFocus: { value: -1 } },
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (startedAt.current === null) startedAt.current = t;
    const age = t - startedAt.current;
    const grow = reduceMotion ? 1 : Math.min(age / GROW_SECONDS, 1);
    const bloom = reduceMotion ? 1 : Math.min(Math.max((age - BLOOM_DELAY) / BLOOM_SECONDS, 0), 1);
    const pixelRatio = state.gl.getPixelRatio();

    branchRef.current.uniforms.uGrow.value = grow;
    for (const material of [blossomRef.current, edgeRef.current, featureRef.current]) {
      material.uniforms.uBloom.value = bloom;
      material.uniforms.uTime.value = t;
      material.uniforms.uMotion.value = reduceMotion ? 0 : 1;
      material.uniforms.uPixelRatio.value = pixelRatio;
    }
    // The hovered (or selected) interest's blossom grows and brightens
    featureRef.current.uniforms.uFocus.value = hovered ?? selected ?? -1;
    if (petalRef.current) {
      petalRef.current.uniforms.uTime.value = t;
      petalRef.current.uniforms.uBloom.value = bloom;
      petalRef.current.uniforms.uPixelRatio.value = pixelRatio;
    }

    // Hide labels on the far side of the planet (and, on narrow screens, near
    // its edge too, where they would run off the screen)
    const camera = state.camera.position.clone().normalize();
    const threshold = state.viewport.aspect < 0.8 ? 0.5 : 0.18;
    anchors.forEach((a, i) => {
      const label = labelRefs.current[i];
      if (!label) return;
      const facing = (a[0] * camera.x + a[1] * camera.y + a[2] * camera.z) / PLANET_RADIUS;
      label.dataset.facing = facing > threshold && bloom > 0.3 ? "true" : "false";
    });
  });

  return (
    <group>
      <PlanetBody />
      <CloudPuffs reduceMotion={reduceMotion} />

      <lineSegments geometry={geometries.branches}>
        <shaderMaterial
          ref={branchRef}
          uniforms={uniforms.branches}
          vertexShader={branchVertex}
          fragmentShader={branchFragment}
          transparent
        />
      </lineSegments>

      <points geometry={geometries.blossoms}>
        <shaderMaterial
          ref={blossomRef}
          uniforms={uniforms.blossoms}
          vertexShader={blossomVertex}
          fragmentShader={blossomFragment}
          transparent
          depthWrite={false}
        />
      </points>

      <points geometry={geometries.edge}>
        <shaderMaterial
          ref={edgeRef}
          uniforms={uniforms.blossoms}
          vertexShader={edgeVertex}
          fragmentShader={blossomFragment}
          transparent
          depthWrite={false}
        />
      </points>

      {!reduceMotion && (
        <points geometry={geometries.petals}>
          <shaderMaterial
            ref={petalRef}
            uniforms={uniforms.petals}
            vertexShader={petalVertex}
            fragmentShader={petalFragment}
            transparent
            depthWrite={false}
          />
        </points>
      )}

      <points geometry={geometries.features}>
        <shaderMaterial
          ref={featureRef}
          uniforms={uniforms.features}
          vertexShader={featureVertex}
          fragmentShader={blossomFragment}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {interests.map((interest, i) => (
        <Html key={interest.id} position={anchors[i].map((c) => c * 1.06)} center zIndexRange={[30, 0]}>
          <button
            ref={(el) => {
              labelRefs.current[i] = el;
            }}
            type="button"
            data-facing="false"
            data-active={hovered === i || selected === i}
            onPointerEnter={() => onHover(i)}
            onPointerLeave={() => onHover(null)}
            onFocus={() => onHover(i)}
            onBlur={() => onHover(null)}
            onClick={() => onSelect(i)}
            className="garden-label"
          >
            <span aria-hidden="true" className="garden-label-dot" />
            {interest.title}
          </button>
        </Html>
      ))}
    </group>
  );
}

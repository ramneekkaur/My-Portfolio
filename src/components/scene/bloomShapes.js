import * as THREE from "three";
import { gaussian, mulberry32 } from "@/lib/random";
import { palette } from "@/lib/palette";

// Every particle has a position (and color) in each shape:
//   scatter → seed → neural network → flower
// The shader blends between them, so the same dust reorganises itself.

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

// Seen slightly from the front so the bowl of the flower reads as 3D.
const FLOWER_TILT = -0.5;

const PETAL_LAYERS = [
  { count: 8, length: 4.2, width: 2.5, cup: 1.1, offset: 0, weight: 0.66 },
  { count: 8, length: 2.8, width: 1.9, cup: 1.8, offset: 0.5, weight: 0.34 },
];

const NETWORK_RINGS = [
  { count: 6, radius: 2.2 },
  { count: 12, radius: 4.4 },
];

const color = new THREE.Color();
const direction = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0);

function randomDirection(random) {
  const z = random() * 2 - 1;
  const angle = random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return direction.set(r * Math.cos(angle), r * Math.sin(angle), z);
}

function writeColor(array, i, hexA, hexB, mix, intensity) {
  color.set(hexA).lerp(new THREE.Color(hexB), mix).multiplyScalar(intensity);
  array[i * 3] = color.r;
  array[i * 3 + 1] = color.g;
  array[i * 3 + 2] = color.b;
}

function createNetwork(random) {
  const nodes = [new THREE.Vector3(0, 0, 0)];

  NETWORK_RINGS.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i++) {
      const angle = (i / ring.count) * Math.PI * 2 + ringIndex * 0.3 + random() * 0.4;
      const radius = ring.radius * (0.85 + random() * 0.3);
      nodes.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          Math.sin(angle) * radius * 0.85,
          (random() - 0.5) * 2.4
        )
      );
    }
  });

  // Connect every node to its three nearest neighbours.
  const edges = [];
  const seen = new Set();

  nodes.forEach((node, i) => {
    nodes
      .map((other, j) => ({ j, distance: node.distanceTo(other) }))
      .filter(({ j }) => j !== i)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([nodes[i], nodes[j]]);
        }
      });
  });

  return { nodes, edges };
}

function petalPoint(random, out) {
  const layer = random() < PETAL_LAYERS[0].weight ? PETAL_LAYERS[0] : PETAL_LAYERS[1];
  const petal = Math.floor(random() * layer.count);
  const u = random(); // along the petal, base → tip
  const onOutline = random() < 0.6; // outlines keep the shape crisp
  const v = onOutline ? (random() < 0.5 ? -1 : 1) : random() * 2 - 1; // across

  // Full, rounded petal: widest just past the middle, soft tip
  const halfWidth = (layer.width / 2) * Math.pow(Math.sin(Math.PI * Math.pow(u, 1.1)), 0.6);
  const along = 0.45 + u * layer.length;
  const across = v * halfWidth;
  const lift = layer.cup * u * u; // petals curve up into a bowl

  const angle = ((petal + layer.offset) / layer.count) * Math.PI * 2;
  const x = along * Math.cos(angle) - across * Math.sin(angle);
  const y = along * Math.sin(angle) + across * Math.cos(angle);

  out.set(x, y, lift);
  return { u, onOutline };
}

export function createBloomShapes(count) {
  const random = mulberry32(1302);
  const { nodes, edges } = createNetwork(random);

  const seed = new Float32Array(count * 3);
  const scatter = new Float32Array(count * 3);
  const network = new Float32Array(count * 3);
  const flower = new Float32Array(count * 3);
  const colorSeed = new Float32Array(count * 3);
  const colorNetwork = new Float32Array(count * 3);
  const colorFlower = new Float32Array(count * 3);
  const randoms = new Float32Array(count);
  const sizes = new Float32Array(count);

  const point = new THREE.Vector3();
  const flowerCenterCount = Math.floor(count * 0.16);

  for (let i = 0; i < count; i++) {
    randoms[i] = random();
    sizes[i] = 0.6 + random() * 0.8;

    // Seed: a dense glowing core with a faint halo
    const inHalo = random() < 0.15;
    const seedRadius = inHalo ? 0.5 + random() * 0.8 : Math.abs(gaussian(random)) * 0.28;
    randomDirection(random).multiplyScalar(seedRadius).toArray(seed, i * 3);
    if (inHalo) {
      writeColor(colorSeed, i, palette.electric, palette.moss, random(), 0.35);
    } else {
      writeColor(colorSeed, i, "#e0f2fe", palette.electric, Math.min(seedRadius * 2, 1), 0.4);
    }

    // Scatter: far-away dust that gathers into the seed on load
    randomDirection(random).multiplyScalar(18 + random() * 14).toArray(scatter, i * 3);

    // Neural network: glowing nodes joined by dotted synapses
    if (random() < 0.3) {
      const node = nodes[Math.floor(random() * nodes.length)];
      point.set(gaussian(random), gaussian(random), gaussian(random)).multiplyScalar(0.14).add(node);
      writeColor(colorNetwork, i, "#dbeafe", palette.electric, random() * 0.4, 0.9);
    } else {
      const [a, b] = edges[Math.floor(random() * edges.length)];
      point.lerpVectors(a, b, random());
      point.x += (random() - 0.5) * 0.06;
      point.y += (random() - 0.5) * 0.06;
      writeColor(colorNetwork, i, palette.electric, palette.nebula, random() * 0.5, 0.5 + random() * 0.4);
    }
    point.toArray(network, i * 3);

    // Flower: a phyllotaxis centre (golden angle, as in sunflowers) and petals
    if (i < flowerCenterCount) {
      const radius = 0.85 * Math.sqrt(i / flowerCenterCount);
      const angle = i * GOLDEN_ANGLE;
      point.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.35 * (1 - radius * radius));
      writeColor(colorFlower, i, palette.bloom, palette.moss, radius, 0.85);
    } else {
      const { u, onOutline } = petalPoint(random, point);
      writeColor(colorFlower, i, palette.electric, palette.nebula, u, onOutline ? 0.9 : 0.45);
    }
    point.applyAxisAngle(X_AXIS, FLOWER_TILT).toArray(flower, i * 3);
  }

  const edgeLines = new Float32Array(edges.length * 6);
  edges.forEach(([a, b], i) => {
    a.toArray(edgeLines, i * 6);
    b.toArray(edgeLines, i * 6 + 3);
  });

  return {
    seed,
    scatter,
    network,
    flower,
    colorSeed,
    colorNetwork,
    colorFlower,
    randoms,
    sizes,
    edgeLines,
  };
}

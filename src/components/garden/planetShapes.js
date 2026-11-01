import { mulberry32 } from "@/lib/random";

// Geometry of the Garden World: thin branches that grow along the surface of
// a sphere and fork, blossoms clustered along them, and one anchor point per
// interest. Deterministic (seeded), so the planet looks the same every visit.

export const PLANET_RADIUS = 2;

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const add = (a, b, s = 1) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const normalize = (a) => scale(a, 1 / Math.hypot(a[0], a[1], a[2]));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// Rotate vector v around unit axis k by angle (Rodrigues' formula)
function rotate(v, k, angle) {
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  return add(add(scale(v, c), cross(k, v), s), k, dot(k, v) * (1 - c));
}

function randomUnit(random) {
  const z = random() * 2 - 1;
  const t = random() * Math.PI * 2;
  const r = Math.sqrt(1 - z * z);
  return [r * Math.cos(t), r * Math.sin(t), z];
}

// A direction along the surface at point p
function randomTangent(p, random) {
  const v = randomUnit(random);
  return normalize(add(v, p, -dot(v, p)));
}

// Latitude/longitude (degrees) → point on a sphere
export function latLonToVector(lat, lon, radius = 1) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return [
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

export function createGarden({ blossomCount, anchors }) {
  const random = mulberry32(5021);
  const branches = [];

  // A branch walks along the surface, curving gently and occasionally forking.
  // `start`/`span` place it in the growth timeline (0 → 1).
  function grow(p, t, steps, depth, start, span) {
    const points = [p];
    for (let s = 0; s < steps; s++) {
      t = rotate(t, p, (random() - 0.5) * 0.45);
      p = normalize(add(p, t, 0.042));
      t = normalize(add(t, p, -dot(t, p)));
      points.push(p);
      if (depth < 2 && s > 3 && s < steps - 4 && random() < 0.08) {
        const side = random() < 0.5 ? -1 : 1;
        const at = start + span * (s / steps);
        grow(p, rotate(t, p, side * (0.55 + random() * 0.5)), Math.floor((steps - s) * 0.7), depth + 1, at, span * 0.6);
      }
    }
    branches.push({ points, depth, start, span });
  }

  // Every interest sits where two main branches meet; more branches wander the rest of the globe
  anchors.forEach((anchor) => {
    const p = normalize(anchor);
    const t = randomTangent(p, random);
    grow(p, t, 34 + Math.floor(random() * 14), 0, 0, 0.75);
    grow(p, scale(t, -1), 30 + Math.floor(random() * 14), 0, 0.05, 0.7);
  });
  for (let i = 0; i < 9; i++) {
    const p = randomUnit(random);
    grow(p, randomTangent(p, random), 36 + Math.floor(random() * 16), 0, 0.15 + random() * 0.2, 0.65);
  }

  // Branch lines, with each vertex's moment in the growth timeline
  const segmentCount = branches.reduce((sum, b) => sum + b.points.length - 1, 0);
  const linePositions = new Float32Array(segmentCount * 6);
  const lineProgress = new Float32Array(segmentCount * 2);
  let k = 0;
  branches.forEach(({ points, depth, start, span }) => {
    const lift = PLANET_RADIUS * (1.006 - depth * 0.001);
    for (let i = 0; i < points.length - 1; i++) {
      [points[i], points[i + 1]].forEach((pt, j) => {
        const [x, y, z] = scale(pt, lift);
        linePositions.set([x, y, z], (k * 2 + j) * 3);
        lineProgress[k * 2 + j] = Math.min(start + span * ((i + j) / (points.length - 1)), 1);
      });
      k++;
    }
  });

  // Blossoms clustered along the branches, opening just after the branch reaches them
  const blossomPositions = new Float32Array(blossomCount * 3);
  const blossomDelay = new Float32Array(blossomCount);
  const blossomSize = new Float32Array(blossomCount);
  const blossomSeed = new Float32Array(blossomCount);
  const blossomMix = new Float32Array(blossomCount);
  for (let i = 0; i < blossomCount; i++) {
    const branch = branches[Math.floor(random() * branches.length)];
    const index = Math.floor(random() * branch.points.length);
    const base = branch.points[index];
    const offset = scale(randomTangent(base, random), random() * 0.03);
    const [x, y, z] = scale(normalize(add(base, offset)), PLANET_RADIUS * (1.012 + random() * 0.018));
    blossomPositions.set([x, y, z], i * 3);
    const progress = branch.start + branch.span * (index / (branch.points.length - 1));
    blossomDelay[i] = Math.min(progress * 0.8 + random() * 0.15, 0.95);
    blossomSize[i] = 0.55 + random() * 0.9;
    blossomSeed[i] = random();
    blossomMix[i] = random(); // 0 dusty rose → 1 pale petal
  }

  // Drifting petals: they leave from random blossoms and float slowly outwards
  const petalCount = Math.round(blossomCount / 20);
  const petalStart = new Float32Array(petalCount * 3);
  const petalDrift = new Float32Array(petalCount * 3);
  const petalOffset = new Float32Array(petalCount);
  for (let i = 0; i < petalCount; i++) {
    const b = Math.floor(random() * blossomCount);
    const start = [blossomPositions[b * 3], blossomPositions[b * 3 + 1], blossomPositions[b * 3 + 2]];
    petalStart.set(start, i * 3);
    const out = normalize(start);
    petalDrift.set(normalize(add(out, randomTangent(out, random), 0.9)), i * 3);
    petalOffset[i] = random();
  }

  return {
    linePositions,
    lineProgress,
    blossoms: { positions: blossomPositions, delay: blossomDelay, size: blossomSize, seed: blossomSeed, mix: blossomMix },
    petals: { start: petalStart, drift: petalDrift, offset: petalOffset },
  };
}

// Edge blossoms: spread evenly over the whole surface (a jittered Fibonacci
// sphere). The shader only shows the ones at the planet's outline, so the pink
// rim of blossoms is equally full all the way round, from every angle.
export function createEdgeBlossoms(count) {
  const random = mulberry32(5171);
  const golden = Math.PI * (3 - Math.sqrt(5));
  const positions = new Float32Array(count * 3);
  const delay = new Float32Array(count);
  const size = new Float32Array(count);
  const seed = new Float32Array(count);
  const mix = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const y = 1 - ((i + 0.5) / count) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = i * golden;
    const base = [Math.cos(a) * r, y, Math.sin(a) * r];
    const jitter = scale(randomTangent(base, random), random() * 0.04);
    positions.set(scale(normalize(add(base, jitter)), PLANET_RADIUS * (1.012 + random() * 0.018)), i * 3);
    delay[i] = 0.5 + random() * 0.4; // the rim fills in late in the bloom
    size[i] = 0.55 + random() * 0.75;
    seed[i] = random();
    mix[i] = random();
  }
  return { positions, delay, size, seed, mix };
}

// Soft cloud puffs drifting around the world, each a cluster of round sprites
// on its own slow, tilted orbit. Positions are given in the puff's orbit frame;
// the shader turns them along the orbit.
export function createCloudPuffs(count = 7) {
  const random = mulberry32(8803);
  const spritesPerPuff = 12;
  const total = count * spritesPerPuff;
  const offset = new Float32Array(total * 3); // sprite position within its puff
  const orbit = new Float32Array(total * 4); // axis (xyz) + speed (rad/s)
  const start = new Float32Array(total * 3); // puff centre at time 0
  const size = new Float32Array(total);
  const seed = new Float32Array(total);

  for (let c = 0; c < count; c++) {
    const radius = PLANET_RADIUS * (1.22 + random() * 0.18);
    const centre = scale(randomUnit(random), radius);
    const axis = normalize(cross(normalize(centre), randomUnit(random)));
    const speed = ((Math.PI * 2) / (60 + random() * 60)) * (random() < 0.5 ? -1 : 1);
    const puffSeed = random();
    // Sprites spread in the plane facing out from the planet, a little flattened
    const n = normalize(centre);
    const tangentA = randomTangent(n, random);
    const tangentB = cross(n, tangentA);
    for (let i = 0; i < spritesPerPuff; i++) {
      const index = c * spritesPerPuff + i;
      const a = random() * Math.PI * 2;
      const r = Math.sqrt(random()) * 0.5;
      const o = add(add(scale(tangentA, Math.cos(a) * r), tangentB, Math.sin(a) * r * 0.4), n, (random() - 0.5) * 0.06);
      offset.set(o, index * 3);
      orbit.set([...axis, speed], index * 4);
      start.set(centre, index * 3);
      size.set([0.7 + random() * 0.7], index);
      seed.set([puffSeed], index);
    }
  }
  return { offset, orbit, start, size, seed };
}

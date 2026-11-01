// Shared, mutable scroll state. Written by SmoothScroll, Hero and SeedBloom, read inside
// useFrame loops, so the 3D scene follows the scroll without React re-renders.
export const scrollState = {
  progress: 0, // 0 at the top of the page, 1 at the bottom
  velocity: 0,
  hero: 0, // hero section progress, see lib/heroTimeline.js
  bloom: 0, // current shape of the hero seed: 0 seed, 1 network, 2 flower
};

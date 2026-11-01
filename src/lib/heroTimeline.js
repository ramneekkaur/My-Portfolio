// Scroll timeline of the hero, as fractions of the hero section's scroll
// (0 = page top, 1 = hero fully scrolled away). Shared by the hero text
// (Hero.js) and the 3D seed (SeedBloom.js) so both stay in step.
//
// The hero is 300vh tall with a sticky 100vh stage, so the stage is pinned
// from 0 to 2/3 and scrolls away from 2/3 to 1.
export const HERO = {
  titleOut: 0.14, // title fades out as the seed starts growing
  networkStart: 0.06, // seed → neural network
  networkEnd: 0.3,
  flowerStart: 0.36, // neural network → flower
  flowerEnd: 0.58,
  exitStart: 2 / 3, // stage unpins and scrolls away
};

// "Warp into a star": opening a project dives the camera forward through the
// starfield (CameraRig in scene/CosmicScene.js) while light streaks rush out
// from the clicked star (components/WarpStreaks.js).

export const WARP_PEAK_MS = 650; // the project file opens at the peak of the dive
export const WARP_RETURN_MS = 1100; // the camera then eases back

export const warpState = {
  startedAt: null, // performance.now() when the warp began
};

const listeners = new Set();

export function onWarp(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Starts the warp from screen point (x, y); resolves at the dive's peak.
export function startWarp(x, y) {
  warpState.startedAt = performance.now();
  listeners.forEach((listener) => listener({ x, y }));
  return new Promise((resolve) => setTimeout(resolve, WARP_PEAK_MS));
}

// 0 → 1 → 0 over the warp: eases in to the peak, then back out.
export function warpAmount(now) {
  if (warpState.startedAt === null) return 0;
  const t = now - warpState.startedAt;
  if (t < WARP_PEAK_MS) {
    const k = t / WARP_PEAK_MS;
    return k * k * k;
  }
  const back = (t - WARP_PEAK_MS) / WARP_RETURN_MS;
  if (back >= 1) {
    warpState.startedAt = null;
    return 0;
  }
  return 1 - (1 - Math.pow(1 - back, 3));
}

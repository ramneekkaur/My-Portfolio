"use client";

import { useSyncExternalStore } from "react";

// Signals when the opening scene has started (the dust begins gathering into
// the seed), so the hero text can be timed against the 3D scene rather than
// page load — on slower devices the scene starts noticeably later.
let started = false;
const listeners = new Set();

export function markIntroStarted() {
  if (started) return;
  started = true;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIntroStarted() {
  return useSyncExternalStore(subscribe, () => started, () => false);
}

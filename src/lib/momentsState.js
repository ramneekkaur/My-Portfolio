"use client";

import { useSyncExternalStore } from "react";

// Shared between the planet's interest panel, the interest cards and the
// Moments grid: which hobby the grid shows ("all" or an interest id) and which
// post is open in the viewer (its id, or null).
let state = { filter: "all", open: null };
const listeners = new Set();

function set(changes) {
  state = { ...state, ...changes };
  listeners.forEach((listener) => listener());
}

export const setMomentsFilter = (filter) => set({ filter });
export const openMoment = (id) => set({ open: id });
export const closeMoment = () => set({ open: null });

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const SERVER_STATE = { filter: "all", open: null };

export function useMoments() {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

// Maps value from [inMin, inMax] to [outMin, outMax], clamped to the range.
export function mapRange(value, inMin, inMax, outMin = 0, outMax = 1) {
  const t = Math.min(Math.max((value - inMin) / (inMax - inMin), 0), 1);
  return outMin + t * (outMax - outMin);
}

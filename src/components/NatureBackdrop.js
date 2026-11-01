const WAVE_PERIOD = 1200; // the SVG shows one period; the path holds two
const WAVE_HEIGHT = 128;

// A gentle periodic wave spanning two periods, so sliding it left by one
// period loops seamlessly.
function wavePath(baseline, amplitude) {
  const half = WAVE_PERIOD / 2;
  let d = `M0 ${baseline}`;

  for (let x = 0, i = 0; x < WAVE_PERIOD * 2; x += half, i++) {
    const direction = i % 2 === 0 ? -1 : 1;
    d += ` Q${x + half / 2} ${baseline + direction * amplitude * 2} ${x + half} ${baseline}`;
  }

  return d;
}

const BACK_WAVE = wavePath(64, 16);
const FRONT_WAVE = wavePath(82, 12);

// Background for Nature & Vision: an organic flowing edge and a soft
// dark-green ground — stepping out of space into the garden.
export default function NatureBackdrop() {
  return (
    <div aria-hidden="true" className="nature-backdrop pointer-events-none absolute inset-0 -z-10">
      <svg
        viewBox={`0 0 ${WAVE_PERIOD} ${WAVE_HEIGHT}`}
        preserveAspectRatio="none"
        className="absolute inset-x-0 top-0 h-32 w-full"
      >
        <defs>
          <linearGradient id="nature-wave-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-bloom)" stopOpacity="0.1" />
            <stop offset="1" stopColor="var(--color-bloom)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g className="nature-wave nature-wave-back">
          <path d={`${BACK_WAVE} V${WAVE_HEIGHT} H0 Z`} fill="url(#nature-wave-fill)" />
        </g>
        <g className="nature-wave nature-wave-front">
          <path d={`${FRONT_WAVE} V${WAVE_HEIGHT} H0 Z`} fill="url(#nature-wave-fill)" />
          <path
            d={FRONT_WAVE}
            fill="none"
            stroke="var(--color-bloom)"
            strokeOpacity="0.35"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        </g>
      </svg>
    </div>
  );
}

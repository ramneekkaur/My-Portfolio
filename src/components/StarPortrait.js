"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { mulberry32 } from "@/lib/random";
import { useMediaQuery, usePrefersReducedMotion } from "@/lib/useMediaQuery";

const STARS = 2600;
const STARS_MOBILE = 1400;
const BACKGROUND_SHARE = 0.07; // faint stray stars around the figure
const SETTLE_S = 2.6; // stars drifting in and settling
const STAGGER_S = 0.9;
const PHOTO_AT_S = 3.1; // the real photo fades through after this
const BACKGROUND_REST = 0.3; // stars around you that stay (faintly) once the photo is in
const BRIGHT_CAP = 0.85; // brightest spots are capped here, so stars don't pile up
const GRID_W = 120; // brightness sampling grid (4:5, like the frame)
const GRID_H = 150;
const PUSH_RADIUS = 95; // px around the pointer that stars scatter from
const PUSH = 3.2;

const DEFAULT_SUBJECT = { x: 0.5, y: 0.35 };

// A small, optimised copy of the photo to sample (not the full original)
const sampleUrl = (src) => `/_next/image?url=${encodeURIComponent(src)}&w=384&q=75`;

// The 4:5 part of the photo shown in the frame, in the photo's own pixels.
// `crop` ({ x, y, width } as fractions of the photo) frames a head and
// shoulders; without it, the photo is centred like "object-fit: cover".
function cropBox(crop, width, height) {
  if (crop) {
    const sw = Math.min(crop.width * width, height / 1.25);
    const sh = sw * 1.25;
    const sx = Math.min(Math.max(crop.x * width, 0), width - sw);
    const sy = Math.min(Math.max(crop.y * height, 0), height - sh);
    return { sx, sy, sw, sh };
  }
  const sw = Math.min(width, height / 1.25);
  const sh = sw * 1.25;
  return { sx: (width - sw) / 2, sy: (height - sh) / 2, sw, sh };
}

// Placement of the photo inside the frame, from its crop box
function photoStyle(box, width, height) {
  return {
    position: "absolute",
    maxWidth: "none",
    width: `${(width / box.sw) * 100}%`,
    height: `${(height / box.sh) * 100}%`,
    left: `${(-box.sx / box.sw) * 100}%`,
    top: `${(-box.sy / box.sh) * 100}%`,
  };
}

// Two passes of a box blur: a cheap, soft blur of the brightness grid
function blur(values, radius) {
  let current = values;
  for (let pass = 0; pass < 2; pass++) {
    const out = new Float32Array(current.length);
    for (let y = 0; y < GRID_H; y++) {
      for (let x = 0; x < GRID_W; x++) {
        let sum = 0;
        let n = 0;
        for (let dy = -radius; dy <= radius; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const yy = y + dy;
            const xx = x + dx;
            if (yy < 0 || yy >= GRID_H || xx < 0 || xx >= GRID_W) continue;
            sum += current[yy * GRID_W + xx];
            n++;
          }
        }
        out[y * GRID_W + x] = sum / n;
      }
    }
    current = out;
  }
  return current;
}

// A soft head-and-shoulders shape around the person, so the stars draw them
// rather than the bright sky or street lights behind
function silhouette(x, y, subject) {
  const oval = (cx, cy, rx, ry) => {
    const dx = (x - cx) / rx;
    const dy = (y - cy) / ry;
    return Math.exp(-Math.pow(dx * dx + dy * dy, 1.5) * 2.2);
  };
  return Math.max(oval(subject.x, subject.y - 0.02, 0.2, 0.21), oval(subject.x + 0.01, subject.y + 0.5, 0.52, 0.4));
}

// How much each cell attracts stars: brightness (stretched within the
// person), local contrast and edges (eyes, smile, hairline, the scarf's
// folds), shaped by the silhouette
function sampleImage(image, crop, subject) {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const box = cropBox(crop, image.width, image.height);
  ctx.drawImage(image, box.sx, box.sy, box.sw, box.sh, 0, 0, GRID_W, GRID_H);
  const light = luminance(ctx.getImageData(0, 0, GRID_W, GRID_H).data);
  const soft = blur(light, 2);

  const mask = new Float32Array(light.length);
  const inside = [];
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const i = y * GRID_W + x;
      mask[i] = silhouette(x / GRID_W, y / GRID_H, subject);
      if (mask[i] > 0.5) inside.push(light[i]);
    }
  }
  inside.sort((a, b) => a - b);
  const low = inside[Math.floor(inside.length * 0.05)] ?? 0;
  const high = inside[Math.floor(inside.length * 0.97)] ?? 1;

  const values = new Float32Array(light.length);
  for (let y = 0; y < GRID_H; y++) {
    for (let x = 0; x < GRID_W; x++) {
      const i = y * GRID_W + x;
      const at = (dx, dy) => light[Math.min(GRID_H - 1, Math.max(0, y + dy)) * GRID_W + Math.min(GRID_W - 1, Math.max(0, x + dx))];
      const edge = Math.min(1, Math.hypot(at(1, 0) - at(-1, 0), at(0, 1) - at(0, -1)) * 2.5);
      const stretched = Math.min(Math.max((light[i] - low) / Math.max(high - low, 0.01), 0), 1);
      const local = Math.min(Math.max((light[i] - soft[i]) * 2.5 + 0.5, 0), 1);
      values[i] = 0.55 * stretched + 0.25 * local + 0.2 * edge;
    }
  }

  // Cap the brightest spots (a highlight on the nose or forehead would
  // otherwise pull a dense cluster of stars), then shape by the silhouette
  const within = [];
  for (let i = 0; i < values.length; i++) if (mask[i] > 0.5) within.push(values[i]);
  within.sort((a, b) => a - b);
  const cap = within[Math.floor(within.length * BRIGHT_CAP)] ?? 1;
  for (let i = 0; i < values.length; i++) values[i] = Math.min(values[i], cap) * (0.03 + 0.97 * mask[i]);
  return { values, mask };
}

// Before a photo is added: the initials, drawn and sampled the same way
function sampleInitials(initials) {
  const canvas = document.createElement("canvas");
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, GRID_W, GRID_H);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${GRID_W * 0.46}px "Space Mono", monospace`;
  ctx.fillText(initials, GRID_W / 2, GRID_H * 0.47);
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(GRID_W / 2, GRID_H * 0.47, GRID_W * 0.42, 0, Math.PI * 2);
  ctx.stroke();
  return { values: luminance(ctx.getImageData(0, 0, GRID_W, GRID_H).data), mask: null };
}

function luminance(data) {
  const values = new Float32Array(GRID_W * GRID_H);
  for (let i = 0; i < values.length; i++) {
    values[i] = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255;
  }
  return values;
}

// Star targets: brighter cells get more stars (and brighter ones)
function placeStars({ values, mask }, count, seed, power) {
  const random = mulberry32(seed);
  const weights = new Float32Array(values.length);
  let total = 0;
  let brightest = 0;
  for (let i = 0; i < values.length; i++) {
    brightest = Math.max(brightest, values[i]);
    total += Math.pow(values[i], power);
    weights[i] = total;
  }

  const stars = {
    count,
    tx: new Float32Array(count), // target, 0–1 across the frame
    ty: new Float32Array(count),
    sx: new Float32Array(count), // start, scattered
    sy: new Float32Array(count),
    ox: new Float32Array(count), // pointer push offset, px
    oy: new Float32Array(count),
    light: new Float32Array(count),
    delay: new Float32Array(count),
    phase: new Float32Array(count),
    subject: new Float32Array(count), // 1 on the person, 0 in the background
  };
  for (let i = 0; i < count; i++) {
    let cell;
    let light;
    if (random() < BACKGROUND_SHARE || total === 0) {
      cell = Math.floor(random() * values.length);
      light = 0.15 + random() * 0.2;
    } else {
      // binary search the cumulative weights
      const pick = random() * total;
      let lo = 0;
      let hi = weights.length - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (weights[mid] < pick) lo = mid + 1;
        else hi = mid;
      }
      cell = lo;
      light = 0.35 + 0.6 * Math.pow(values[cell] / (brightest || 1), 1.5);
    }
    stars.subject[i] = mask ? mask[cell] : 0;
    stars.tx[i] = ((cell % GRID_W) + random()) / GRID_W;
    stars.ty[i] = (Math.floor(cell / GRID_W) + random()) / GRID_H;
    // Start scattered around (and beyond) the frame, like stars drifting in
    const angle = random() * Math.PI * 2;
    const reach = 0.35 + random() * 0.6;
    stars.sx[i] = 0.5 + Math.cos(angle) * reach;
    stars.sy[i] = 0.5 + Math.sin(angle) * reach;
    stars.light[i] = light;
    stars.delay[i] = random() * STAGGER_S;
    stars.phase[i] = random() * Math.PI * 2;
  }
  return stars;
}

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

// A portrait made of stars: they drift in and settle into the photo's light
// and shadow, then the real photo fades through beneath them. Stars near the
// pointer scatter and drift back. Without a photo, they form the initials.
export default function StarPortrait({ photo, initials, onScan }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [revealed, setRevealed] = useState(false);
  const [usePhoto, setUsePhoto] = useState(Boolean(photo));
  const [size, setSize] = useState(null); // the photo's proportions, once sampled
  const [starView, setStarView] = useState(false); // hover / tap: the constellation returns
  const starViewRef = useRef(false);
  const redrawRef = useRef(null);
  const reduceMotion = usePrefersReducedMotion();
  const isMobile = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const count = isMobile ? STARS_MOBILE : STARS;
    let stars = null;
    let frame = 0;
    let visible = false;
    let startedAt = null;
    let width = 0;
    let height = 0;
    let ratio = 1;
    let view = 0; // star view, eased 0 → 1
    const pointer = { x: 0, y: 0, active: false };
    let cancelled = false;

    function resize() {
      const rect = wrap.getBoundingClientRect();
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      if (!frame) draw(performance.now());
    }

    function draw(now) {
      if (!stars || width === 0) return;
      const time = reduceMotion ? 99 : startedAt === null ? 0 : (now - startedAt) / 1000;
      // Once the photo is in, the stars on the person fade out completely; in
      // star view they all come back
      const fade = usePhoto ? Math.min(Math.max((time - PHOTO_AT_S) / 1.6, 0), 1) : 0;
      view += ((starViewRef.current ? 1 : 0) - view) * (reduceMotion ? 1 : 0.1);

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < stars.count; i++) {
        const progress = easeOut(Math.min(Math.max((time - stars.delay[i]) / SETTLE_S, 0), 1));
        let x = (stars.sx[i] + (stars.tx[i] - stars.sx[i]) * progress) * width;
        let y = (stars.sy[i] + (stars.ty[i] - stars.sy[i]) * progress) * height;

        if (!reduceMotion) {
          // Scatter from the pointer, then ease back
          if (pointer.active) {
            const dx = x + stars.ox[i] - pointer.x;
            const dy = y + stars.oy[i] - pointer.y;
            const distance = Math.hypot(dx, dy);
            if (distance < PUSH_RADIUS && distance > 0.01) {
              const push = (1 - distance / PUSH_RADIUS) * PUSH;
              stars.ox[i] += (dx / distance) * push;
              stars.oy[i] += (dy / distance) * push;
            }
          }
          stars.ox[i] *= 0.92;
          stars.oy[i] *= 0.92;
          x += stars.ox[i];
          y += stars.oy[i];
        }

        const light = stars.light[i];
        const twinkle = reduceMotion ? 1 : 0.72 + 0.28 * Math.sin(time * (1.2 + light) + stars.phase[i]);
        const arriving = 0.25 + 0.75 * progress;
        const rest = (1 - stars.subject[i]) * BACKGROUND_REST;
        const shown = Math.max(1 - fade * (1 - rest), view);
        if (shown < 0.01) continue;
        ctx.globalAlpha = Math.min(1, light * 1.3 * twinkle * arriving * shown);
        ctx.fillStyle = light > 0.82 ? "#f4f9ff" : "#9ccfff";
        const size = 0.7 + light * 1.5;
        ctx.fillRect(x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      // A soft ring of light following the pointer in star view
      if (pointer.active && view > 0.02 && !reduceMotion) {
        const glow = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, PUSH_RADIUS);
        glow.addColorStop(0, `rgba(156, 207, 255, ${0.1 * view})`);
        glow.addColorStop(0.6, `rgba(156, 207, 255, ${0.04 * view})`);
        glow.addColorStop(1, "rgba(156, 207, 255, 0)");
        ctx.fillStyle = glow;
        ctx.fillRect(pointer.x - PUSH_RADIUS, pointer.y - PUSH_RADIUS, PUSH_RADIUS * 2, PUSH_RADIUS * 2);
        ctx.strokeStyle = `rgba(200, 228, 255, ${0.35 * view})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(pointer.x, pointer.y, PUSH_RADIUS * 0.45, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    redrawRef.current = () => draw(performance.now());

    function loop(now) {
      frame = 0;
      if (!visible || cancelled) return;
      if (startedAt === null) startedAt = now;
      draw(now);
      if (usePhoto && !reduceMotion && (now - startedAt) / 1000 > PHOTO_AT_S) setRevealed(true);
      frame = requestAnimationFrame(loop);
    }

    const start = () => {
      if (!frame && visible && !reduceMotion) frame = requestAnimationFrame(loop);
    };

    function build(sample, power) {
      if (cancelled) return;
      stars = placeStars(sample, count, 2099, power);
      resize();
      if (reduceMotion) {
        setRevealed(usePhoto);
        draw(performance.now());
      } else start();
    }

    if (usePhoto) {
      const image = new window.Image();
      image.onload = () => {
        setSize({ width: image.width, height: image.height });
        build(sampleImage(image, photo.crop, photo.subject ?? DEFAULT_SUBJECT), 1.4);
      };
      image.onerror = () => {
        // The optimised copy failed: try the original once, else show the initials
        if (image.src.includes("/_next/image")) image.src = photo.src;
        else setUsePhoto(false);
      };
      image.src = sampleUrl(photo.src);
    } else {
      document.fonts.ready.then(() => build(sampleInitials(initials), 1.6));
    }

    const resizer = new ResizeObserver(resize);
    resizer.observe(wrap);
    const watcher = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    }, { threshold: 0.25 });
    watcher.observe(wrap);

    const move = (event) => {
      const rect = wrap.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
    };
    const leave = () => (pointer.active = false);
    const lift = (event) => event.pointerType !== "mouse" && leave(); // a finger lifted
    wrap.addEventListener("pointermove", move);
    wrap.addEventListener("pointerdown", move);
    wrap.addEventListener("pointerleave", leave);
    wrap.addEventListener("pointerup", lift);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      resizer.disconnect();
      watcher.disconnect();
      wrap.removeEventListener("pointermove", move);
      wrap.removeEventListener("pointerdown", move);
      wrap.removeEventListener("pointerleave", leave);
      wrap.removeEventListener("pointerup", lift);
    };
  }, [photo, usePhoto, initials, isMobile, reduceMotion]);

  const showStars = (value) => {
    starViewRef.current = value;
    setStarView(value);
    if (reduceMotion) requestAnimationFrame(() => redrawRef.current?.());
  };

  return (
    <div
      ref={wrapRef}
      onPointerEnter={(event) => {
        onScan();
        if (event.pointerType === "mouse") showStars(true);
      }}
      onPointerLeave={(event) => event.pointerType === "mouse" && showStars(false)}
      onPointerUp={(event) => {
        // Touch: a tap toggles star view
        if (event.pointerType === "mouse") return;
        onScan();
        showStars(!starViewRef.current);
      }}
      className="crew-portrait relative aspect-[4/5] w-full overflow-hidden"
      data-revealed={revealed}
      data-starview={starView}
    >
      {usePhoto && size && (
        <>
          {/* The photo, cropped to the same head-and-shoulders box the stars use */}
          <Image
            src={photo.src}
            alt={photo.alt}
            width={size.width}
            height={size.height}
            sizes={`(min-width: 768px) ${Math.round(420 / (photo.crop?.width ?? 1))}px, ${Math.round(90 / (photo.crop?.width ?? 1))}vw`}
            className="crew-photo"
            style={photoStyle(cropBox(photo.crop, size.width, size.height), size.width, size.height)}
          />
          <span aria-hidden="true" className="crew-photo-vignette" />
          <span aria-hidden="true" className="crew-starview-shade" />
        </>
      )}
      <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      {!usePhoto && <span className="sr-only">{initials}</span>}
    </div>
  );
}

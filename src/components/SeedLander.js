"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { createGameSound } from "@/lib/gameSound";

// "Land the Seed" — a small vector lander game in the mission-control style.
// Pilot the seed pod down to the glowing garden plot. Get close above it
// under its parachute and touch down softly, and it grows
// into a tree. All game state lives in refs on a fixed-step
// requestAnimationFrame loop, so React only re-renders when a round starts or ends.

const KEY_ACTIONS = {
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  ArrowUp: "thrust",
  KeyW: "thrust",
  Space: "thrust",
  ArrowDown: "chute",
  KeyS: "chute",
  KeyP: "chute",
};

// Tuning, in px at `scale` 1 (canvas height / 400), so it feels the same at
// every screen size. Speeds are shown in "m/s" = px/s ÷ (SPEED_UNIT · scale).
const GRAVITY = 16;
const THRUST = 40;
const TURN_SPEED = 2.4; // radians per second
const MAX_TILT = 1.4;
const FUEL_BURN = 11; // % per second of thrust (about 9 s in total)
const SPEED_UNIT = 10;
// A soft landing: drift up to 2 m/s is allowed, since under a canopy you move with the wind
const SAFE = { vy: 2.2, vx: 2.0, tilt: 0.3 };
const PERFECT = { vy: 1.5, vx: 1.0 }; // a textbook parachute touchdown
const ANCHOR_MS = 600; // roots grow down into the soil before the tree rises

// Parachute — real aerodynamic drag, F = ½·ρ·Cd·A·|v_rel|·v_rel, with
// v_rel = v_pod − v_wind. Lumped as k = ½ρCdA/m, so a = −k·|v_rel|·v_rel and
// the terminal speed is v_t = √(g/k).
const CHUTE_TERMINAL = 1.5; // m/s under a fully open canopy (in still air)
const POD_TERMINAL = 15; // m/s — the bare pod's own small drag
const CHUTE_INFLATE_S = 0.7; // the canopy takes this long to fill (spreads the opening shock)
const PENDULUM_W2 = 15; // (2π/T)² for a ~1.6 s swing under the canopy
const PENDULUM_DAMPING = 2.4;
const CHUTE_TURN = 0.3; // rotate keys are weaker: the lines resist
const CHUTE_GLIDE = 3.5; // m/s — a ram-air canopy glides ~2.3 m forward per metre of drop (glide ratio) when steered
const MAX_WIND = 1.2; // m/s breeze, different every round
const CANOPY_LINE = 26; // px from pod to canopy at scale 1
const POD_BOTTOM = 7; // pod's bottom, from its centre
const GROW_MS = 2400; // the tree grows
const LANDED_MS = 4200; // …then leaves fall
const CRASHED_MS = 1400; // fragments scatter
const STEP = 1 / 60; // fixed physics step: real-time speed at any frame rate
const MAX_CATCH_UP = 0.25; // seconds of simulation allowed per frame

const ease = (t) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

function createWorld(width, height) {
  const scale = height / 400;
  const segments = Math.max(14, Math.round(width / 42));
  const padSegments = 3;
  const padStart = 2 + Math.floor(Math.random() * (segments - padSegments - 4));

  const points = [];
  let y = height * (0.72 + Math.random() * 0.1);
  for (let i = 0; i <= segments; i++) {
    const flat = i > padStart && i <= padStart + padSegments;
    if (!flat) y = Math.min(height * 0.93, Math.max(height * 0.5, y + (Math.random() - 0.5) * height * 0.24));
    points.push([(i / segments) * width, y]);
  }
  const padY = points[padStart][1];
  // Keep the hills right beside the plot low, so it can be approached
  for (let i = padStart - 2; i <= padStart + padSegments + 2; i++) {
    if (points[i] && (i < padStart || i > padStart + padSegments)) {
      points[i][1] = Math.max(points[i][1], padY - height * 0.06);
    }
  }

  const pad = { x1: points[padStart][0], x2: points[padStart + padSegments][0], y: padY };
  const padCentre = (pad.x1 + pad.x2) / 2;
  let startX = padCentre + (Math.random() < 0.5 ? -1 : 1) * width * 0.33;
  if (startX < width * 0.1 || startX > width * 0.9) startX = padCentre - (startX - padCentre);
  startX = Math.min(width * 0.9, Math.max(width * 0.1, startX));

  return {
    width,
    height,
    scale,
    points,
    pad,
    stars: Array.from({ length: Math.round(width / 12) }, () => [
      Math.random() * width,
      Math.random() * height * 0.6,
      Math.random() < 0.15 ? 1.6 : 1,
    ]),
    pod: {
      x: startX,
      y: height * 0.12,
      vx: (Math.random() - 0.5) * SPEED_UNIT * scale,
      vy: 0,
      angle: (Math.random() - 0.5) * 0.3,
      fuel: 100,
      thrusting: false,
      spin: 0, // angular velocity while swinging under the canopy
      load: 0, // deceleration from drag, in g
    },
    chute: { deployed: false, at: 0, inflate: 0 }, // inflate: 0 → 1 as the canopy fills
    wind: (Math.random() < 0.5 ? -1 : 1) * Math.random() * MAX_WIND * SPEED_UNIT * scale,
    motes: Array.from({ length: 16 }, () => [Math.random() * width, Math.random() * height * 0.75, Math.random()]),
    outcome: null, // "landed" | "crashed"
    outcomeAt: 0,
    report: null,
    plant: [],
    leaves: [],
    fragments: [],
    events: [], // sounds to play: "landed" | "crashed" | "fuel" | "leaf" | "chute"
    done: false,
  };
}

function groundAt(world, x) {
  const { points } = world;
  for (let i = 1; i < points.length; i++) {
    if (x <= points[i][0]) {
      const [x1, y1] = points[i - 1];
      const [x2, y2] = points[i];
      return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
    }
  }
  return points[points.length - 1][1];
}

const overPlot = (world, x, margin = 0) => x > world.pad.x1 - margin && x < world.pad.x2 + margin;

// A tall, fine branching tree growing from where the seed settled, and the
// leaves that will break off its outer branches.
function growTree(x, y, s, groundLevel) {
  const segments = [];
  const branch = (x1, y1, angle, length, depth) => {
    const x2 = x1 + Math.sin(angle) * length;
    const y2 = y1 - Math.cos(angle) * length;
    segments.push({ x1, y1, x2, y2, depth });
    if (depth < 5) {
      const spread = 0.3 + Math.random() * 0.25;
      branch(x2, y2, angle - spread, length * 0.74, depth + 1);
      branch(x2, y2, angle + spread, length * 0.74, depth + 1);
    }
  };
  branch(x, y, (Math.random() - 0.5) * 0.08, 34 * s, 0);

  const tips = segments.filter((segment) => segment.depth >= 4);
  const leaves = Array.from({ length: 12 }, (_, i) => {
    const tip = tips[Math.floor(Math.random() * tips.length)];
    return {
      x: tip.x2,
      y: tip.y2,
      startY: tip.y2,
      fallAt: GROW_MS + 150 + i * 140 + Math.random() * 120, // ms after landing
      phase: Math.random() * Math.PI * 2,
      drift: (Math.random() - 0.5) * 14 * s,
      spin: (Math.random() - 0.5) * 3,
      speed: (16 + Math.random() * 10) * s,
      ground: groundLevel,
      fallen: false,
      sounded: false,
    };
  });
  return { segments, leaves };
}

function step(world, keys, dt, now) {
  const s = world.scale;
  const pod = world.pod;

  if (world.outcome) {
    const age = now - world.outcomeAt;
    world.fragments.forEach((f) => {
      f.vy += GRAVITY * s * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.angle += f.spin * dt;
    });
    world.leaves.forEach((leaf, i) => {
      const t = (age - leaf.fallAt) / 1000;
      if (t <= 0) return;
      if (!leaf.sounded) {
        leaf.sounded = true;
        if (i % 3 === 0) world.events.push("leaf");
      }
      if (leaf.fallen) return;
      leaf.y = Math.min(leaf.startY + t * leaf.speed, leaf.ground - 1);
      if (leaf.y >= leaf.ground - 1) {
        leaf.fallen = true;
        leaf.fallenAt = age;
      }
    });
    world.done = age > (world.outcome === "landed" ? LANDED_MS : CRASHED_MS);
    return;
  }

  const unit = SPEED_UNIT * s;
  const chute = world.chute;

  // Deploy the parachute (once per flight)
  if (keys.chute) {
    keys.chute = false;
    if (!chute.deployed) {
      chute.deployed = true;
      chute.at = now;
      world.events.push("chute");
    }
  }
  if (chute.deployed) {
    const t = Math.min((now - chute.at) / 1000 / CHUTE_INFLATE_S, 1);
    chute.inflate = t * t * (3 - 2 * t); // the canopy fills smoothly
  }

  // Steering: direct rotation in free flight; under the canopy the pod is a
  // damped pendulum — gravity and drag pull it back upright
  const turn = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (chute.inflate > 0) {
    pod.spin += (-PENDULUM_W2 * chute.inflate * pod.angle - PENDULUM_DAMPING * pod.spin) * dt;
    pod.angle += (pod.spin + turn * TURN_SPEED * CHUTE_TURN) * dt;
  } else {
    pod.angle += turn * TURN_SPEED * dt;
  }
  pod.angle = Math.min(MAX_TILT, Math.max(-MAX_TILT, pod.angle));

  const hadFuel = pod.fuel > 0;
  pod.thrusting = keys.thrust && pod.fuel > 0;
  if (pod.thrusting) {
    pod.vx += Math.sin(pod.angle) * THRUST * s * dt;
    pod.vy -= Math.cos(pod.angle) * THRUST * s * dt;
    pod.fuel = Math.max(0, pod.fuel - FUEL_BURN * dt);
    if (hadFuel && pod.fuel === 0) world.events.push("fuel");
  }
  pod.vy += GRAVITY * s * dt;

  // Aerodynamic drag through the air (which moves with the wind):
  // a = −k·|v_rel|·v_rel, with k from the terminal speed: k = g / v_t².
  // Under the canopy, ← → pull the steering lines: a ram-air canopy then
  // glides sideways through the air, so the pod settles at wind + glide.
  const g = GRAVITY * s;
  const kPod = g / (POD_TERMINAL * unit) ** 2;
  const kChute = g / (CHUTE_TERMINAL * unit) ** 2;
  const k = kPod + (kChute - kPod) * chute.inflate;
  const glide = turn * CHUTE_GLIDE * unit * chute.inflate;
  const rx = pod.vx - (world.wind + glide);
  const ry = pod.vy;
  const speed = Math.hypot(rx, ry);
  const ax = -k * speed * rx;
  const ay = -k * speed * ry;
  pod.vx += ax * dt;
  pod.vy += ay * dt;
  pod.load = Math.hypot(ax, ay) / g;

  pod.x += pod.vx * dt;
  pod.y += pod.vy * dt;
  if (pod.x < 0) pod.x += world.width;
  if (pod.x > world.width) pod.x -= world.width;

  const ground = groundAt(world, pod.x);
  if (pod.y + POD_BOTTOM * s < ground) return;

  // Touchdown
  const vy = pod.vy / unit;
  const vx = Math.abs(pod.vx) / unit;
  const tilt = Math.abs(pod.angle);
  const onPlot = overPlot(world, pod.x, 4 * s);
  const soft = vy < SAFE.vy && vx < SAFE.vx && tilt < SAFE.tilt;

  world.outcomeAt = now;
  pod.thrusting = false;
  world.report = { vy, perfect: soft && vy < PERFECT.vy && vx < PERFECT.vx };

  if (onPlot && soft) {
    world.outcome = "landed";
    pod.y = world.pad.y - POD_BOTTOM * s;
    pod.angle = 0;
    world.anchorX = pod.x;
    const tree = growTree(pod.x, world.pad.y - POD_BOTTOM * s * 1.6, s, world.pad.y);
    world.plant = tree.segments;
    world.leaves = tree.leaves;
    world.events.push("landed");
  } else {
    world.outcome = "crashed";
    world.report.reason = !onPlot
      ? "Missed the plot"
      : vy >= SAFE.vy
        ? "Descent too fast"
        : vx >= SAFE.vx
          ? "Drifting sideways"
          : "Landed tilted";
    world.fragments = Array.from({ length: 16 }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
      const speed = (30 + Math.random() * 70) * s;
      return {
        x: pod.x,
        y: ground - 3 * s,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle: Math.random() * Math.PI,
        spin: (Math.random() - 0.5) * 10,
        length: (2 + Math.random() * 4) * s,
      };
    });
    world.events.push("crashed");
  }
}

function readColors() {
  const css = getComputedStyle(document.documentElement);
  const get = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  return {
    phosphor: get("--color-phosphor", "#8cc8ff"),
    electric: get("--color-electric", "#60a5fa"),
    bloom: get("--color-bloom", "#3dbe8b"),
    moss: get("--color-moss", "#6b8f71"),
    blossom: get("--color-blossom", "#e8a3bd"),
    white: get("--color-white", "#e3eeff"),
    gray: get("--color-gray-500", "#66758c"),
    space: get("--color-space", "#0b0f1a"),
    font: getComputedStyle(document.body).fontFamily,
  };
}

// The parachute: an upright canopy on fine suspension lines; the pod swings
// beneath it. It widens as it fills and ripples a little in the airflow.
function drawChute(ctx, pod, chute, s, c, now) {
  const fill = chute.inflate;
  const line = CANOPY_LINE * s;
  const top = [pod.x + Math.sin(pod.angle) * 9 * s, pod.y - Math.cos(pod.angle) * 9 * s]; // pod's nose
  const cx = pod.x + Math.sin(pod.angle) * (9 * s + line);
  const cy = pod.y - Math.cos(pod.angle) * (9 * s + line);
  const ripple = 1 + Math.sin(now / 140) * 0.03 * fill;
  const rx = (5 + 15 * fill) * s * ripple;
  const ry = (3 + 8 * fill) * s;

  ctx.strokeStyle = c.white;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 0.6;
  for (let i = 0; i <= 6; i++) {
    const x = cx - rx + (i / 6) * rx * 2;
    ctx.beginPath();
    ctx.moveTo(top[0], top[1]);
    ctx.lineTo(x, cy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Canopy dome with its gores
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = c.space;
  ctx.fill();
  ctx.strokeStyle = c.phosphor;
  ctx.lineWidth = 1;
  if (fill > 0.9) {
    ctx.shadowColor = c.phosphor;
    ctx.shadowBlur = 6;
  }
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.45;
  for (let i = 1; i < 4; i++) {
    const gx = cx - rx + (i / 4) * rx * 2;
    ctx.beginPath();
    ctx.moveTo(gx, cy);
    ctx.quadraticCurveTo(gx + (cx - gx) * 0.3, cy - ry * 0.9, cx, cy - ry);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPod(ctx, pod, s, c) {
  ctx.save();
  ctx.translate(pod.x, pod.y);
  ctx.rotate(pod.angle);
  if (pod.thrusting) {
    ctx.strokeStyle = c.electric;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-2.2 * s, 7.5 * s);
    ctx.lineTo(0, (12 + Math.random() * 8) * s);
    ctx.lineTo(2.2 * s, 7.5 * s);
    ctx.stroke();
  }
  // The seed pod: a fine teardrop with a glowing core
  ctx.beginPath();
  ctx.moveTo(0, -9 * s);
  ctx.bezierCurveTo(6 * s, -3 * s, 5.5 * s, 7 * s, 0, 7 * s);
  ctx.bezierCurveTo(-5.5 * s, 7 * s, -6 * s, -3 * s, 0, -9 * s);
  ctx.fillStyle = c.space;
  ctx.fill();
  ctx.strokeStyle = c.white;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = c.phosphor;
  ctx.beginPath();
  ctx.arc(0, 2 * s, 1.7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// A curve drawn up to `progress` (0–1)
function partialCurve(ctx, from, control, to, progress) {
  const steps = 16;
  ctx.beginPath();
  ctx.moveTo(from[0], from[1]);
  for (let i = 1; i <= Math.ceil(steps * progress); i++) {
    const t = Math.min(i / steps, progress);
    const u = 1 - t;
    ctx.lineTo(
      u * u * from[0] + 2 * u * t * control[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * control[1] + t * t * to[1]
    );
  }
  ctx.stroke();
}

function drawLeaf(ctx, x, y, angle, s, color, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.6 * s, 1.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function draw(ctx, world, now, c) {
  const { width, height, scale: s, pod, pad } = world;
  ctx.clearRect(0, 0, width, height);

  // Stars
  ctx.fillStyle = c.gray;
  world.stars.forEach(([x, y, r]) => ctx.fillRect(x, y, r, r));

  // Motes carried by the breeze, so the wind is visible
  ctx.fillStyle = c.phosphor;
  world.motes.forEach(([x, y, k]) => {
    const mx = (((x + (now / 1000) * world.wind * (0.6 + k)) % width) + width) % width;
    ctx.globalAlpha = 0.18 + k * 0.25;
    ctx.fillRect(mx, y + Math.sin(now / 1300 + k * 9) * 4, 1.2, 1.2);
  });
  ctx.globalAlpha = 1;

  // Terrain: a fine vector line with a faint ground below
  ctx.beginPath();
  world.points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = c.phosphor;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = c.phosphor;
  ctx.fill();
  ctx.globalAlpha = 1;

  // The garden plot
  ctx.strokeStyle = c.bloom;
  ctx.lineWidth = 2;
  ctx.shadowColor = c.bloom;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(pad.x1, pad.y);
  ctx.lineTo(pad.x2, pad.y);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = c.bloom;
  ctx.font = `9px ${c.font}`;
  ctx.textAlign = "center";
  // The label gives way to the anchoring roots after a landing
  if (world.outcome === "landed") ctx.globalAlpha = Math.max(0, 1 - (now - world.outcomeAt) / ANCHOR_MS);
  ctx.fillText("P L O T", (pad.x1 + pad.x2) / 2, pad.y + 15);
  ctx.globalAlpha = 1;

  const ground = groundAt(world, pod.x);
  const bottom = pod.y + POD_BOTTOM * s;

  // Guide line: where the pod would touch down if it fell straight now
  if (!world.outcome) {
    ctx.setLineDash([2, 5]);
    ctx.strokeStyle = overPlot(world, pod.x) ? c.bloom : c.gray;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pod.x, bottom + 4 * s);
    ctx.lineTo(pod.x, ground);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  // After a soft landing, fine roots grow down into the soil, anchoring the seed
  if (world.outcome === "landed") {
    const progress = ease((now - world.outcomeAt) / ANCHOR_MS);
    const x = world.anchorX;
    ctx.strokeStyle = c.bloom;
    ctx.lineWidth = 0.9;
    ctx.shadowColor = c.bloom;
    ctx.shadowBlur = 6;
    [-1, -0.4, 0.4, 1].forEach((side) => {
      const from = [x, pad.y];
      const to = [x + side * 18 * s, pad.y + (14 + Math.abs(side) * 4) * s];
      const control = [x + side * 4 * s, pad.y + 12 * s];
      partialCurve(ctx, from, control, to, progress);
    });
    ctx.shadowBlur = 0;
  }

  if (world.outcome === "crashed") {
    ctx.strokeStyle = c.white;
    ctx.lineWidth = 1;
    ctx.globalAlpha = Math.max(0, 1 - (now - world.outcomeAt) / CRASHED_MS);
    world.fragments.forEach((f) => {
      ctx.beginPath();
      ctx.moveTo(f.x - Math.cos(f.angle) * f.length, f.y - Math.sin(f.angle) * f.length);
      ctx.lineTo(f.x + Math.cos(f.angle) * f.length, f.y + Math.sin(f.angle) * f.length);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  } else {
    if (world.outcome === "landed") {
      const age = now - world.outcomeAt;
      const t = Math.min(Math.max(age - ANCHOR_MS * 0.6, 0) / GROW_MS, 1) * 6.5;
      world.plant.forEach(({ x1, y1, x2, y2, depth }) => {
        const p = Math.min(Math.max(t - depth, 0), 1);
        if (p === 0) return;
        ctx.strokeStyle = depth < 3 ? c.bloom : depth < 5 ? c.moss : c.phosphor;
        ctx.lineWidth = depth < 1 ? 1.6 : depth < 3 ? 1.1 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 + (x2 - x1) * p, y1 + (y2 - y1) * p);
        ctx.stroke();
        if (depth === 5 && p === 1) {
          ctx.fillStyle = c.blossom;
          ctx.beginPath();
          ctx.arc(x2, y2, 1.5 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      // Leaves: on the tree, drifting down, then fading where they land
      world.leaves.forEach((leaf, i) => {
        if (age < GROW_MS * 0.9) return;
        const fallFor = Math.max((age - leaf.fallAt) / 1000, 0);
        const falling = fallFor > 0 && !leaf.fallen;
        const sway = falling ? Math.sin(fallFor * 2.6 + leaf.phase) * 7 * s : 0;
        const x = leaf.x + sway + fallFor * leaf.drift;
        const angle = leaf.phase + fallFor * leaf.spin;
        const alpha = leaf.fallen ? Math.max(0, 1 - (age - leaf.fallenAt) / 700) : 1;
        drawLeaf(ctx, x, leaf.y, angle, s, i % 2 ? c.bloom : c.moss, alpha);
      });
    }
    // The canopy collapses at touchdown
    if (world.chute.deployed && !world.outcome) drawChute(ctx, pod, world.chute, s, c, now);
    drawPod(ctx, pod, s, c);
  }

  // Telemetry
  const unit = SPEED_UNIT * s;
  const vy = pod.vy / unit;
  const vx = pod.vx / unit;
  const altitude = Math.max(0, (ground - bottom) / unit);
  ctx.font = `10px ${c.font}`;
  ctx.textAlign = "left";
  const rows = [
    ["ALT", `${altitude.toFixed(1)} m`, c.white],
    ["V/S", `${vy.toFixed(1)} m/s`, Math.abs(vy) < SAFE.vy ? c.bloom : c.white],
    ["H/S", `${vx.toFixed(1)} m/s`, Math.abs(vx) < SAFE.vx ? c.bloom : c.white],
    ["TILT", `${Math.round((pod.angle * 180) / Math.PI)}°`, Math.abs(pod.angle) < SAFE.tilt ? c.bloom : c.white],
  ];
  rows.forEach(([label, value, color], i) => {
    ctx.fillStyle = c.gray;
    ctx.fillText(label, 14, 22 + i * 15);
    ctx.fillStyle = color;
    ctx.fillText(value, 50, 22 + i * 15);
  });
  ctx.fillStyle = c.gray;
  ctx.fillText("FUEL", 14, 82);
  ctx.strokeStyle = c.phosphor;
  ctx.globalAlpha = 0.5;
  ctx.strokeRect(50, 75, 80, 7);
  ctx.globalAlpha = 1;
  ctx.fillStyle = pod.fuel > 20 ? c.phosphor : c.white;
  ctx.fillRect(51, 76, (78 * pod.fuel) / 100, 5);

  const chute = world.chute;
  const wind = world.wind / unit;
  const extra = [
    ["CHUTE", !chute.deployed ? "READY ↓" : chute.inflate < 1 ? "OPENING" : "OPEN", chute.deployed ? c.bloom : c.white],
    ["WIND", `${wind >= 0 ? "→" : "←"} ${Math.abs(wind).toFixed(1)} m/s`, c.white],
  ];
  if (chute.deployed && chute.inflate < 1) extra.push(["LOAD", `${pod.load.toFixed(1)} G`, c.white]);
  extra.forEach(([label, value, color], i) => {
    ctx.fillStyle = c.gray;
    ctx.fillText(label, 14, 100 + i * 15);
    ctx.fillStyle = color;
    ctx.fillText(value, 56, 100 + i * 15);
  });
}

// "How to play", shown on hover or focus (or a tap on touch screens)
function HowToPlay({ touch }) {
  const [open, setOpen] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative" onPointerEnter={() => !touch && setOpen(true)} onPointerLeave={() => !touch && setOpen(false)}>
      <button
        type="button"
        aria-expanded={open}
        aria-describedby={id}
        aria-label="How to play"
        onClick={() => setOpen((value) => !value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="btn-terminal px-3 py-2"
      >
        ?
      </button>
      <div
        id={id}
        role="tooltip"
        data-open={open}
        className="game-help absolute right-0 top-full z-30 mt-3 w-[min(22rem,80vw)]"
      >
        <div className="panel game-help-body p-5 pt-7 text-left">
          <p className="panel-title">[ How to play ]</p>
          <dl className="space-y-3 text-xs leading-relaxed text-gray-300">
            <div>
              <dt className="term-label">Mission</dt>
              <dd className="mt-1">Land the seed pod on the glowing plot, and it grows into a tree.</dd>
            </div>
            <div>
              <dt className="term-label">Controls</dt>
              <dd className="mt-1">
                {touch ? "◀ ▶ rotate · hold ▲ to thrust · Chute to deploy" : "← → rotate · hold ↑ or space to thrust · ↓ or P parachute"}.
                Tilt to move sideways, then straighten up.
              </dd>
            </div>
            <div>
              <dt className="term-label">Parachute (once)</dt>
              <dd className="mt-1">
                Real drag: it grows with speed squared and slows your fall and drift. It takes about a second to open,
                so deploy early. Under the canopy you swing upright and drift with the wind — pull the steering lines
                with ← → to glide towards the plot.
              </dd>
            </div>
            <div>
              <dt className="term-label">Safe landing</dt>
              <dd className="mt-1">
                Touch down on the plot falling slower than {SAFE.vy} m/s, drifting less than {SAFE.vx} m/s and nearly
                upright. The readouts turn green when safe.
              </dd>
            </div>
            <div>
              <dt className="term-label" data-tone="nature">
                Tip
              </dt>
              <dd className="mt-1">
                Deploy the chute high enough to slow below {SAFE.vy} m/s, steer over the plot with ← →, and stop
                steering just before touchdown.
              </dd>
            </div>
            <div>
              <dt className="term-label">Fuel</dt>
              <dd className="mt-1">Limited — the dotted line shows where you&apos;ll touch down.</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

function readMuted() {
  try {
    return sessionStorage.getItem("seed-lander-muted") === "1";
  } catch {
    return false;
  }
}

export default function SeedLander() {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const world = useRef(null);
  const colors = useRef(null);
  const keys = useRef({ left: false, right: false, thrust: false, chute: false });
  const raf = useRef(0);
  const visible = useRef(true);
  const sound = useRef(null);
  const [phase, setPhase] = useState("idle"); // idle | playing | landed | crashed
  const [report, setReport] = useState(null);
  const [muted, setMuted] = useState(false);
  const [chuteUsed, setChuteUsed] = useState(false);
  const touch = useMediaQuery("(pointer: coarse)");

  const context = () => canvasRef.current?.getContext("2d");

  // Size the canvas to its container (DPR-aware) and lay out a fresh world.
  useEffect(() => {
    const canvas = canvasRef.current;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      const height = Math.max(260, Math.round(width * (width < 640 ? 0.75 : 0.42)));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.height = `${height}px`;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      colors.current ??= readColors();
      world.current = createWorld(width, height);
      draw(ctx, world.current, performance.now(), colors.current);
    });
    observer.observe(canvas.parentElement);

    // Pause the simulation while the game is off-screen
    const visibility = new IntersectionObserver(([entry]) => {
      visible.current = entry.isIntersecting;
    });
    visibility.observe(canvas);

    // The visitor's sound choice for this visit
    if (readMuted()) queueMicrotask(() => setMuted(true));

    return () => {
      observer.disconnect();
      visibility.disconnect();
      cancelAnimationFrame(raf.current);
      sound.current?.close();
    };
  }, []);

  const toggleMuted = () => {
    const next = !muted;
    setMuted(next);
    sound.current?.setMuted(next);
    try {
      sessionStorage.setItem("seed-lander-muted", next ? "1" : "0");
    } catch {
      // Storage unavailable: the choice just isn't remembered
    }
  };

  const launch = () => {
    // Sounds start on this click, as browsers require
    sound.current ??= createGameSound();
    sound.current.setMuted(muted);
    sound.current.resume();
    sound.current.launch();

    const { width, height } = world.current;
    world.current = createWorld(width, height);
    keys.current = { left: false, right: false, thrust: false, chute: false };
    setChuteUsed(false);
    setPhase("playing");
    setReport(null);
    wrapRef.current?.focus({ preventScroll: true });

    cancelAnimationFrame(raf.current);
    let last = performance.now();
    let pending = 0;
    let wasThrusting = false;
    const frame = (now) => {
      // Fixed-step simulation, so slow devices run in real time, not slow motion
      pending = visible.current ? Math.min(pending + (now - last) / 1000, MAX_CATCH_UP) : 0;
      last = now;
      const w = world.current;
      while (pending >= STEP) {
        step(w, keys.current, STEP, now);
        pending -= STEP;
      }

      // Sounds for what just happened
      if (w.pod.thrusting !== wasThrusting) {
        wasThrusting = w.pod.thrusting;
        sound.current.thrust(wasThrusting);
      }
      w.events.splice(0).forEach((event) => {
        if (event === "landed") sound.current.landed();
        if (event === "crashed") sound.current.crashed();
        if (event === "fuel") sound.current.fuelEmpty();
        if (event === "leaf") sound.current.leaf();
        if (event === "chute") {
          sound.current.chuteDeploy();
          setChuteUsed(true);
        }
        if (event === "landed" || event === "crashed") sound.current.chuteOff();
      });

      const ctx = context();
      if (ctx) draw(ctx, w, now, colors.current);
      if (w.done) {
        sound.current.suspend();
        setReport(w.report);
        setPhase(w.outcome);
        return;
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  };

  const setKey = (action, down) => {
    if (down && !keys.current[action] && (action === "left" || action === "right")) sound.current?.tick();
    if (action === "chute" && !down) return; // a deploy is a one-shot press, consumed by the physics step
    keys.current[action] = down;
  };

  const onKey = (down) => (event) => {
    const action = KEY_ACTIONS[event.code];
    if (!action || phase !== "playing") return;
    event.preventDefault(); // arrows and space must not scroll the page
    setKey(action, down);
  };

  const holdButton = (action, label, symbol) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        setKey(action, true);
      }}
      onPointerUp={() => setKey(action, false)}
      onPointerLeave={() => setKey(action, false)}
      onPointerCancel={() => setKey(action, false)}
      className="btn-terminal justify-center px-0 py-4 [touch-action:none] before:hidden after:hidden"
    >
      {symbol}
    </button>
  );

  return (
    <div className="panel p-5 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ Mission · Land the seed ]</p>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold uppercase tracking-wide md:text-2xl">Land the Seed</h2>
          <p className="mt-2 text-sm text-gray-400">
            Pilot the seed to the garden plot. Open the parachute and land softly.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden text-[0.6rem] uppercase tracking-[0.25em] text-gray-500 sm:block">
            {touch ? "◀ ▶ rotate · ▲ thrust · chute" : "← → rotate · ↑ thrust · ↓ chute"}
          </p>
          <button
            type="button"
            onClick={toggleMuted}
            aria-pressed={!muted}
            aria-label={muted ? "Turn game sound on" : "Turn game sound off"}
            className="btn-terminal px-3 py-2"
          >
            ♪ {muted ? "Off" : "On"}
          </button>
          <HowToPlay touch={touch} />
        </div>
      </div>

      <div
        ref={wrapRef}
        tabIndex={-1}
        onKeyDown={onKey(true)}
        onKeyUp={onKey(false)}
        onBlur={() => (keys.current = { left: false, right: false, thrust: false, chute: false })}
        className="lander relative outline-none"
      >
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Land the Seed: a lander game. Pilot the seed pod onto the glowing garden plot, opening its parachute to land softly."
          className="block w-full"
        />

        {phase !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-space/55 px-6 text-center backdrop-blur-[2px]">
            {phase === "idle" && (
              <p className="text-xs uppercase tracking-[0.25em] text-gray-300">
                &gt; Seed pod ready · plot detected<span aria-hidden="true" className="cursor-block" />
              </p>
            )}
            {phase === "landed" && (
              <>
                <p className="text-sm uppercase tracking-[0.25em] text-bloom">&gt; Seed planted. Garden online.</p>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-400">
                  {report.perfect ? "Perfect landing" : `Landed at ${report.vy.toFixed(1)} m/s`}
                </p>
              </>
            )}
            {phase === "crashed" && (
              <>
                <p className="text-sm uppercase tracking-[0.25em] text-white">&gt; Signal lost. Seed scattered.</p>
                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-gray-400">{report.reason}</p>
              </>
            )}
            <button type="button" onClick={launch} className="btn-terminal btn-terminal-primary">
              {phase === "idle" ? "Launch" : phase === "landed" ? "Play again" : "Retry"}
            </button>
          </div>
        )}
      </div>

      {touch && phase === "playing" && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {holdButton("left", "Rotate left", "◀")}
          {holdButton("thrust", "Thrust", "▲")}
          {holdButton("right", "Rotate right", "▶")}
          <button
            type="button"
            aria-label="Deploy parachute"
            disabled={chuteUsed}
            onPointerDown={(event) => {
              event.preventDefault();
              setKey("chute", true);
            }}
            className="btn-terminal justify-center px-0 py-4 [touch-action:none] before:hidden after:hidden disabled:opacity-40"
          >
            {chuteUsed ? "Chute ✓" : "Chute"}
          </button>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        {phase === "landed"
          ? `Seed planted. ${report?.perfect ? "Perfect landing." : ""}`
          : phase === "crashed"
            ? `Signal lost. ${report?.reason}.`
            : ""}
      </p>
    </div>
  );
}

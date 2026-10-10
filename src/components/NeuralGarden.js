"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SkillCard from "@/components/SkillCard";
import { mulberry32 } from "@/lib/random";
import { usePrefersReducedMotion } from "@/lib/useMediaQuery";

const FIRE_STEP = 0.07; // seconds between skills lighting up, like neurons firing
const PULSE_EVERY_MS = 2600; // ambient signal along a random connection

// Every distinct skill, in order of appearance, with the species it feeds.
function collectSkillNodes(skills) {
  const nodes = new Map();
  skills.forEach((skill, species) => {
    skill.tags.forEach((tag) => {
      if (!nodes.has(tag)) nodes.set(tag, { name: tag, species: [] });
      nodes.get(tag).species.push(species);
    });
  });
  return [...nodes.values()];
}

// Positions relative to the container, measured from the real layout so the
// network fits every breakpoint.
function measure(container, chips, cards) {
  const box = container.getBoundingClientRect();
  const relative = (el) => {
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - box.left + rect.width / 2,
      top: rect.top - box.top,
      bottom: rect.bottom - box.top,
    };
  };

  return {
    width: box.width,
    height: box.height,
    chips: chips.map(relative),
    cards: cards.map(relative),
  };
}

const curve = (from, to) => {
  const bend = (to.y - from.y) * 0.6;
  return `M${from.x} ${from.y} C${from.x} ${from.y + bend} ${to.x} ${to.y - bend} ${to.x} ${to.y}`;
};

// Wide screens (cards in one row): a two-layer neural network — every skill
// node connects down into the species cards it belongs to.
function buildNetwork(layout, skillNodes) {
  return skillNodes.flatMap((node, skill) =>
    node.species.map((card) => ({
      skill,
      card,
      d: curve(
        { x: layout.chips[skill].x, y: layout.chips[skill].bottom + 4 },
        { x: layout.cards[card].x, y: layout.cards[card].top }
      ),
    }))
  );
}

// Stacked cards: each card grows from the nearest card above it.
function buildChain({ cards }) {
  return cards.flatMap((card, i) => {
    let parent = -1;
    let best = Infinity;
    cards.forEach((other, j) => {
      if (j === i || other.bottom > card.top) return;
      const distance = Math.abs(other.x - card.x) + (card.top - other.bottom);
      if (distance < best) {
        best = distance;
        parent = j;
      }
    });
    if (parent === -1) return [];
    return [{ card: i, d: curve({ x: cards[parent].x, y: cards[parent].bottom }, { x: card.x, y: card.top }) }];
  });
}

// Fine rootlets trailing below the cards — the garden keeps growing.
function rootlets(card, index) {
  const random = mulberry32(index * 97 + 13);

  return [-1, 0, 1].map((offset) => {
    const x = card.x + offset * 22 + (random() - 0.5) * 12;
    const y = card.bottom;
    const drift = (random() - 0.5) * 70;
    const length = 45 + random() * 45;
    return `M${x} ${y} C${x} ${y + length * 0.5} ${x + drift} ${y + length * 0.6} ${x + drift * 1.2} ${y + length}`;
  });
}

// Skills as a living neural network: skill nodes fire one by one, signals
// travel down their connections, and the species cards they feed appear.
export default function NeuralGarden({ skills }) {
  const containerRef = useRef(null);
  const chipRefs = useRef([]);
  const cardRefs = useRef([]);
  const [layout, setLayout] = useState(null);
  const [activeCard, setActiveCard] = useState(null);
  const [activeSkill, setActiveSkill] = useState(null);
  const [pulse, setPulse] = useState(null);
  const reduceMotion = usePrefersReducedMotion();
  const inView = useInView(containerRef, { once: true, amount: 0.2 });

  const skillNodes = collectSkillNodes(skills);
  const fireDuration = skillNodes.length * FIRE_STEP;

  useLayoutEffect(() => {
    const container = containerRef.current;
    // ResizeObserver also fires once on observe, giving the first measurement.
    const observer = new ResizeObserver(() => {
      setLayout(measure(container, chipRefs.current.filter(Boolean), cardRefs.current.filter(Boolean)));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const singleRow =
    layout && layout.cards.every((card) => Math.abs(card.top - layout.cards[0].top) < 2);
  const network = layout && singleRow ? buildNetwork(layout, skillNodes) : [];
  const chain = layout && !singleRow ? buildChain(layout) : [];

  // Once the network has formed, an occasional signal fires along a random connection.
  useEffect(() => {
    if (!inView || reduceMotion || network.length === 0) return;
    const count = network.length;
    let started = false;
    const start = setTimeout(() => (started = true), (fireDuration + 2.5) * 1000);
    const timer = setInterval(() => {
      if (started) setPulse({ index: Math.floor(Math.random() * count), key: Date.now() });
    }, PULSE_EVERY_MS);
    return () => {
      clearTimeout(start);
      clearInterval(timer);
    };
  }, [inView, reduceMotion, network.length, fireDuration]);

  const cardLit = (card) =>
    activeCard === card || (activeSkill !== null && skillNodes[activeSkill].species.includes(card));
  const skillLit = (skill) =>
    activeSkill === skill || (activeCard !== null && skillNodes[skill].species.includes(activeCard));
  const connectionLit = (connection) =>
    activeCard === connection.card || activeSkill === connection.skill;

  return (
    <div ref={containerRef} className="relative pt-16">
      {layout && (
        <svg
          className="pointer-events-none absolute inset-0 z-20 overflow-visible"
          width={layout.width}
          height={layout.height}
          aria-hidden="true"
        >
          {network.map((connection, i) => (
            <g key={`n-${connection.skill}-${connection.card}`}>
              <motion.path
                d={connection.d}
                fill="none"
                strokeWidth={1}
                className={`transition-colors duration-500 ${
                  connectionLit(connection) ? "stroke-electric/70" : "stroke-electric/20"
                }`}
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.2, delay: fireDuration * 0.6 + connection.skill * 0.05, ease: "easeInOut" }}
              />
              {(connectionLit(connection) || pulse?.index === i) && (
                <path
                  key={connectionLit(connection) ? "lit" : pulse.key}
                  d={connection.d}
                  pathLength="1"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className={`garden-sap stroke-sky-100 ${connectionLit(connection) ? "" : "is-once"}`}
                />
              )}
            </g>
          ))}

          {chain.map((root) => (
            <g key={`c-${root.card}`}>
              <motion.path
                d={root.d}
                fill="none"
                strokeWidth={1}
                className="stroke-electric/30"
                initial={{ pathLength: 0 }}
                animate={inView ? { pathLength: 1 } : undefined}
                transition={{ duration: 1.6, delay: 0.6 + root.card * 0.4, ease: "easeInOut" }}
              />
              {activeCard === root.card && (
                <path
                  d={root.d}
                  pathLength="1"
                  fill="none"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="garden-sap stroke-sky-100"
                />
              )}
            </g>
          ))}

          {/* Rootlets below the last row of cards */}
          {layout.cards.map((card, i) =>
            singleRow || i === layout.cards.length - 1
              ? rootlets(card, i).map((d, k) => (
                  <motion.path
                    key={`r-${i}-${k}`}
                    d={d}
                    fill="none"
                    strokeWidth={0.75}
                    className="stroke-bloom/25"
                    initial={{ pathLength: 0 }}
                    animate={inView ? { pathLength: 1 } : undefined}
                    transition={{ duration: 2.4, delay: fireDuration + 1.6 + k * 0.2 }}
                  />
                ))
              : null
          )}

          {/* One breathing node per species, where its connections arrive */}
          {layout.cards.map((card, i) => (
            <g key={`node-${i}`}>
              <circle
                cx={card.x}
                cy={card.top}
                r={10}
                className={`garden-node fill-electric/15 ${cardLit(i) ? "is-active" : ""}`}
              />
              <circle
                cx={card.x}
                cy={card.top}
                r={3.5}
                className={`garden-node fill-sky-100 ${cardLit(i) ? "is-active" : ""}`}
              />
            </g>
          ))}
        </svg>
      )}

      {/* Input layer: the skills themselves */}
      <ul className="relative z-30 mx-auto flex max-w-5xl flex-wrap justify-center gap-x-4 gap-y-4">
        {skillNodes.map((node, i) => (
          <li
            key={node.name}
            ref={(el) => {
              chipRefs.current[i] = el;
            }}
            data-fired={inView}
            data-lit={skillLit(i)}
            data-cursor="interactive"
            style={{ "--delay": `${i * FIRE_STEP}s` }}
            onPointerEnter={() => setActiveSkill(i)}
            onPointerLeave={() => setActiveSkill((current) => (current === i ? null : current))}
            className="skill-node"
          >
            <span aria-hidden="true" className="skill-node-dot" />
            {node.name}
          </li>
        ))}
      </ul>

      {/* Output layer: the species */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : undefined}
        transition={{ duration: 1.2, delay: fireDuration * 0.6 + 0.8 }}
        className="mt-16 grid gap-x-5 gap-y-16 md:grid-cols-2 lg:mt-28 lg:grid-cols-4"
      >
        {skills.map((skill, i) => (
          <SkillCard
            key={skill.title}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            index={i}
            title={skill.title}
            description={skill.description}
            tags={skill.tags}
            active={cardLit(i)}
            onActivate={() => setActiveCard(i)}
            onDeactivate={() => setActiveCard((current) => (current === i ? null : current))}
          />
        ))}
      </motion.div>
    </div>
  );
}

"use client";

import SkillSpecimen from "@/components/SkillSpecimen";

// A skill as a "species" in the Neural Garden, shown as a terminal panel
// with its botanical specimen plate. Its connections and node are drawn by
// NeuralGarden; hovering lights them up and grows the specimen.
export default function SkillCard({ ref, index, title, description, tags = [], specimen, active, onActivate, onDeactivate }) {
  return (
    <div
      ref={ref}
      data-cursor="interactive"
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      data-active={active}
      className="panel p-6 pt-8"
    >
      <SkillSpecimen kind={specimen} index={index} active={active} />

      <h3 className="font-display text-base font-bold uppercase tracking-wide text-white mb-3 md:text-lg">
        {title}
      </h3>

      <p className="text-sm text-gray-400 leading-relaxed">
        {description}
      </p>

      {tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-wider text-electric/80 lg:hidden">
          {tags.map((tag) => (
            <li key={tag}>[{tag}]</li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

// A skill as a "species" in the Neural Garden. Its root and breathing node
// are drawn by NeuralGarden; hovering lights them up.
export default function SkillCard({ ref, index, title, description, tags = [], active, onActivate, onDeactivate }) {
  return (
    <div
      ref={ref}
      data-cursor="interactive"
      onPointerEnter={onActivate}
      onPointerLeave={onDeactivate}
      className={`rounded-2xl border p-6 pt-8 backdrop-blur-sm transition-colors duration-700 ${
        active
          ? "border-electric/40 bg-electric/[0.06]"
          : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="mb-4 text-[0.65rem] uppercase tracking-[0.35em] text-electric/70">
        Species {String(index + 1).padStart(2, "0")}
      </p>

      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>

      <p className="text-gray-400 leading-relaxed">
        {description}
      </p>

      {tags.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-electric/70 lg:hidden">
          {tags.map((tag) => (
            <li key={tag}>{tag}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

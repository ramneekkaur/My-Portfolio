// Small line icons for the section tags, one per chapter.
const ICONS = {
  // Three joined nodes — a neural network
  network: (
    <>
      <path d="M4 6 L12 4 L20 9 M4 6 L10 16 L20 9 M12 4 L10 16" strokeOpacity="0.55" />
      <circle cx="4" cy="6" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="12" cy="4" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="20" cy="9" r="1.8" fill="currentColor" stroke="none" />
      <circle cx="10" cy="16" r="2.2" fill="currentColor" stroke="none" />
    </>
  ),
  // Concentric tree rings, drawn in one by one (.section-ring in globals.css)
  rings: (
    <>
      <circle className="section-ring" pathLength="1" cx="12" cy="12" r="2.5" />
      <circle className="section-ring" pathLength="1" cx="12" cy="12" r="5.5" />
      <circle className="section-ring" pathLength="1" cx="12" cy="12" r="8.5" />
      <circle className="section-ring" pathLength="1" cx="12" cy="12" r="11" />
    </>
  ),
  // A four-pointed star
  star: <path d="M12 2 C12.8 8.5 15.5 11.2 22 12 C15.5 12.8 12.8 15.5 12 22 C11.2 15.5 8.5 12.8 2 12 C8.5 11.2 11.2 8.5 12 2 Z" fill="currentColor" stroke="none" />,
  // A root reaching downwards
  root: (
    <>
      <path d="M3 4 H21" strokeOpacity="0.55" />
      <path d="M12 4 C12 9 9 11 9 15 C9 18 11 19 11 22 M12 9 C15 10 17 12 17 16 M9 15 C7 15 5 17 5 19" />
    </>
  ),
  // A leaf with its midrib
  leaf: (
    <>
      <path d="M5 19 C4 11 9 5 20 4 C19 15 13 20 5 19 Z" />
      <path d="M5 19 C9 14 13 10 16 8" strokeOpacity="0.6" />
    </>
  ),
  // A page with a folded corner and a small star — the star chart
  document: (
    <>
      <path d="M6 2.5 H14 L19 7.5 V21.5 H6 Z" />
      <path d="M14 2.5 V7.5 H19" strokeOpacity="0.6" />
      <path d="M12.5 11 C12.8 13.2 13.6 14 15.8 14.3 C13.6 14.6 12.8 15.4 12.5 17.6 C12.2 15.4 11.4 14.6 9.2 14.3 C11.4 14 12.2 13.2 12.5 11 Z" fill="currentColor" stroke="none" />
    </>
  ),
  // A signal broadcasting outwards
  signal: (
    <>
      <circle cx="12" cy="14" r="2" fill="currentColor" stroke="none" />
      <path d="M8.5 10.5 a5 5 0 0 1 7 0 M5.5 7.5 a9.2 9.2 0 0 1 13 0" />
    </>
  ),
};

export default function SectionIcon({ name, className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 shrink-0 ${className}`}
    >
      {ICONS[name]}
    </svg>
  );
}

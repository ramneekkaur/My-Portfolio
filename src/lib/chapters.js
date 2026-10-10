// The page's chapters, in order — the single source of section names.
//   id      matches the section id in page.js
//   label   the clear name of the section (shown in its tag and the navigation)
//   title   the poetic title shown large in the section header
//   icon    the tag's icon (components/SectionIcon.js)
//   realm   colour of the chapter: space (white), tech (blue) or nature (green)
export const CHAPTERS = [
  { id: "seed", label: "Intro", title: "The Seed", realm: "space" },
  { id: "neural-garden", label: "Skills", title: "Neural Ecosystem", icon: "network", realm: "tech" },
  { id: "growth-rings", label: "Experience & Education", title: "Growth Rings", icon: "rings", realm: "tech" },
  { id: "projects", label: "Projects", title: "Constellations of Work", icon: "star", realm: "tech" },
  {
    id: "quantum-roots",
    label: "Research Interests & Philosophy",
    title: "Quantum Roots",
    icon: "root",
    realm: "tech",
  },
  { id: "nature", label: "Beyond the Code", title: "Nature & Vision", icon: "leaf", realm: "nature" },
  { id: "resume", label: "Résumé", title: "Star Chart", icon: "document", realm: "space" },
  { id: "contact", label: "Contact", title: "Send a Signal", icon: "signal", realm: "space" },
].map((chapter, i) => ({ ...chapter, number: String(i).padStart(2, "0") }));

export const chapter = (id) => CHAPTERS.find((c) => c.id === id);

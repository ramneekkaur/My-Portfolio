// Everything the site says about Ramneek, taken from the CV.
// Edit content here — the components only arrange it.

export const profile = {
  name: "Ramneek Kaur",
  role: "Machine learning & AI-driven systems",
  studies: "MSc Computer Science, Universität Paderborn",
  location: "Paderborn, Germany",
  emails: [
    { label: "Personal", address: "kaurramneek2099@gmail.com" },
    { label: "University", address: "rk2099@campus.uni-paderborn.de" },
  ],
  links: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/ramneek-kaur-31734a189/" },
    { label: "GitHub", href: "https://github.com/ramneekkaur" },
  ],
  // The downloadable CV. To update it, replace the PDF in public/resume/
  // and change `updated` (its file size is read automatically).
  resume: {
    href: "/resume/Ramneek_Kaur_Resume.pdf",
    fileName: "Ramneek_Kaur_Resume.pdf",
    pages: 2,
    updated: "September 2026",
  },
};

// Neural Garden: each skill family is a "species", with its specimen plate
// (components/SkillSpecimen.js): arbor, filix, radix or crystallus.
export const skills = [
  {
    title: "Machine Learning",
    specimen: "arbor",
    description:
      "Predictive models, graph neural networks and explainable AI — finding the patterns hidden inside data.",
    tags: ["Python", "Explainable AI", "Graph neural networks", "OpenCV"],
  },
  {
    title: "LLM & RAG Systems",
    specimen: "filix",
    description:
      "Retrieval pipelines, reranking and evaluation that keep language models grounded in real sources.",
    tags: ["LangChain", "FAISS", "Hugging Face", "RAG", "Topic modelling"],
  },
  {
    title: "Data Engineering",
    specimen: "radix",
    description:
      "ETL and big-data workflows that turn large business datasets into decisions.",
    tags: ["SQL", "ETL", "Big Data", "MongoDB", "AWS"],
  },
  {
    title: "Software Engineering",
    specimen: "crystallus",
    description:
      "Building dependable systems end to end, from algorithms to APIs and interfaces.",
    tags: ["Python", "Java", "C / C++", "FastAPI", "Git"],
  },
];

// Growth Rings: experience, education and volunteering, oldest first.
// kind: "education" | "work" | "community"; current: still ongoing.
export const timeline = [
  {
    kind: "education",
    dates: "Aug 2017 – Aug 2021",
    title: "Bachelor of Technology, Computer Science & Engineering",
    org: "Guru Gobind Singh Indraprastha University — GTB Institute of Technology",
    location: "New Delhi, India",
  },
  {
    kind: "work",
    dates: "Jun 2020 – Aug 2020",
    title: "Data Mining Intern",
    org: "Peacock Solar",
    location: "India",
    points: [
      "Led the analysis of customer solar-panel consumption data to generate insights for energy-usage strategies.",
      "Cleaned, transformed and explored large datasets to find patterns, trends and opportunities for efficiency.",
      "Presented findings through dashboards and reports that guided decisions on resource allocation.",
    ],
    tags: ["Python", "Data analysis", "Dashboards"],
  },
  {
    kind: "work",
    dates: "Mar 2021 – Sep 2021",
    title: "Business Technical Solutions Associate Intern",
    org: "ZS Associates",
    location: "India",
    points: [
      "Designed and implemented a dynamic targeting system that helps sales representatives build effective call plans.",
      "Developed a resource optimization algorithm to identify high-priority healthcare professionals (HCPs) in each territory.",
      "Worked hands-on with real-world datasets during the final year of my degree.",
    ],
    tags: ["Python", "SQL", "Big Data", "Java", "Maven"],
  },
  {
    kind: "work",
    dates: "Oct 2021 – Dec 2023",
    title: "Business Technical Solutions Associate",
    org: "ZS Associates",
    location: "India",
    points: [
      "Developed sales-focused predictive machine learning models to improve targeting and interaction strategies.",
      "Delivered commercial and medical suggestions to sales representatives and Medical Science Liaisons (MSLs) for more effective engagement with HCPs.",
      "Communicated model insights to client teams, enabling data-driven planning.",
    ],
    tags: ["Python", "SQL", "Machine Learning", "Big Data", "Java"],
  },
  {
    kind: "work",
    dates: "Jan 2024 – Feb 2025",
    title: "Business Technical Solutions Associate Consultant",
    org: "ZS Associates",
    location: "India",
    points: [
      "Led a four-person team delivering data-driven next-best-action suggestions used by sales representatives across multiple accounts.",
      "Analyzed and transformed large business datasets into actionable insights for commercial strategy.",
      "Presented insights in regular client reviews, aligning analytical outputs with business needs.",
    ],
    tags: ["Python", "SQL", "Machine Learning", "Big Data"],
  },
  {
    kind: "education",
    dates: "Apr 2025 – Present",
    current: true,
    title: "Master of Science, Computer Science",
    org: "Universität Paderborn",
    location: "Paderborn, Germany",
  },
  {
    kind: "community",
    dates: "Sep 2025 – Feb 2026",
    title: "Member, Outgoing Global Volunteer (OGV) Team",
    org: "AIESEC Paderborn",
    location: "Paderborn, Germany",
    points: [
      "Helped participants find suitable international volunteering opportunities.",
      "Coordinated with host organizations on placements and logistics.",
      "Guided applicants through the whole journey — application, preparation and post-experience support.",
    ],
  },
  {
    kind: "work",
    dates: "May 2026 – Present",
    current: true,
    title: "Student Research Assistant",
    org: "Universität Paderborn — Department of Protestant Theology",
    location: "Paderborn, Germany",
    points: [
      "Explain fundamental AI and LLM concepts to students in a seminar.",
      "Develop and prepare instructional materials for lectures.",
      "Help students build their own AI chatbot.",
    ],
    tags: ["Python", "LLMs", "RAG", "Topic modelling"],
  },
];

// Constellations of Work: each project is a star.
// hue: "electric" | "nebula" | "bloom" — the colour of its planet.
// links (optional): [{ label: "GitHub", href: "https://…" }]
export const projects = [
  {
    id: "rag-pipeline",
    title: "RAG Pipeline",
    type: "LLM Systems",
    hue: "electric",
    summary: "Hybrid retrieval and reranking, with built-in hallucination checks.",
    description:
      "A retrieval-augmented generation pipeline that combines BM25 keyword search with vector retrieval and reranks the results with a cross-encoder. A RAGAS evaluation suite and an LLM-based hallucination detector keep its answers grounded.",
    highlights: [
      { value: "+32%", label: "answer accuracy over naive vector search" },
      { value: "−25%", label: "ungrounded outputs" },
    ],
    tech: ["LangChain", "FastAPI", "Streamlit", "FAISS", "ChatGroq", "Hugging Face"],
  },
  {
    id: "fast-rgcn",
    title: "Fast RGCN on MUTAG",
    type: "Graph ML · Explainable AI",
    hue: "nebula",
    summary: "Training and explaining a relational graph network.",
    description:
      "Training and interpreting a Relational Graph Convolutional Network on the MUTAG RDF dataset using Fast RGCN, with GNN Explainer revealing which parts of the graph drive its predictions.",
    tech: ["Python", "Machine Learning", "Graph neural networks", "Explainable AI"],
  },
  {
    id: "cosmic-garden",
    title: "Cosmic Garden",
    type: "Creative Development",
    hue: "bloom",
    status: "Live build",
    summary: "This site — a seed that grows into a neural network and blooms.",
    description:
      "A cinematic, scroll-driven portfolio: a particle seed grows into a neural network and blooms into a flower, roots grow beneath the content, and a generative soundscape follows the bloom.",
    tech: ["Next.js", "React Three Fiber", "GLSL shaders", "Framer Motion", "Web Audio"],
  },
];

// Research Interests & Philosophy: the questions growing beneath the work.
// Each interest is a glowing root tip; `from` says where it took root.
export const researchInterests = [
  {
    title: "Quantum computing",
    description: "Computation that is probabilistic, layered and deeply interconnected.",
    from: "A long-standing fascination",
  },
  {
    title: "Explainable AI",
    description: "Making models show which parts of the data drive their decisions.",
    from: "Fast RGCN & GNN Explainer",
  },
  {
    title: "Grounded LLMs",
    description: "Retrieval and evaluation that keep language models honest to their sources.",
    from: "RAG pipeline & hallucination detection",
  },
];

// Send a Signal: languages, shown as the "frequencies" Ramneek receives on.
export const languages = [
  { name: "English", level: "Expert" },
  { name: "Deutsch", level: "Intermediate" },
  { name: "Hindi", level: "Native" },
  { name: "Punjabi", level: "Mother tongue" },
];

// The Garden World (/garden): the interests that grow beyond the code, each a
// glowing blossom on the planet. `lat`/`lon` place it on the globe (degrees).
// Photos for each one are posted as "moments" at /garden/upload.
// Stories marked "edit me" are placeholders — rewrite them in your own words.
export const interests = [
  {
    id: "nature",
    title: "Nature",
    summary: "Gardening, flowers, trekking — and this beautiful world.",
    story:
      "I love gardening, flowers and trekking, and simply seeing this beautiful world — a quiet trail, a flower opening, the light changing over a valley. Nature reminds me that complex systems need patience, attention, and care. Intelligence, like nature, grows through structure and time.",
    lat: 28,
    lon: -18,
  },
  {
    id: "travelling",
    title: "Travelling",
    summary: "New places, new cultures, and the roads between them.",
    story:
      "Travelling shows me how differently the world can look — new places, new cultures, new ways of thinking. Every journey widens the map a little, and I always come home with new ideas. (edit me)",
    lat: -46,
    lon: -52,
  },
  {
    id: "technology",
    title: "Technology & AI",
    summary: "Intelligent systems as living networks.",
    story:
      "I explore intelligent systems as living networks — where algorithms, data, and curiosity grow like roots beneath the surface.",
    lat: -14,
    lon: 52,
  },
  {
    id: "space",
    title: "Space & Astronomy",
    summary: "An infinite canvas of possibility.",
    story:
      "The night sky is where my curiosity started: an infinite canvas that makes every question feel worth asking. (edit me)",
    lat: 46,
    lon: 118,
  },
  {
    id: "photography",
    title: "Photography",
    summary: "Macro flowers, garden light and quiet details.",
    story:
      "I photograph the small worlds I notice — petals up close, light through leaves, the quiet details of the garden. (edit me)",
    lat: -22,
    lon: -118,
  },
  {
    id: "science-fiction",
    title: "Science Fiction",
    summary: "A language for possible futures.",
    story:
      "Space and science fiction give me a language for possibility — a way to imagine futures where computation, life, and curiosity expand together.",
    lat: 8,
    lon: 178,
  },
];

// Everything the site says about Ramneek, taken from the CV.
// Edit content here — the components only arrange it.

export const profile = {
  name: "Ramneek Kaur",
  role: "Machine learning & AI-driven systems",
  studies: "MSc Computer Science, Universität Paderborn",
  location: "Paderborn, Germany",
  // About (Crew Profile): put your photo at public/profile/ramneek.jpg — a
  // portrait, face roughly centred, at least 800px wide. Until it's there,
  // the star portrait shows your initials.
  //   crop     the 4:5 part of the photo shown, as fractions of the photo
  //            (x, y = its top-left corner; width = its share of the width)
  //   subject  where your face is inside that crop (0–1), so the stars gather
  //            into your head and shoulders rather than the background
  //   place    shown in the frame's caption
  photo: {
    src: "/profile/ramneek.jpg",
    alt: "Portrait of Ramneek Kaur on a canal bridge in Amsterdam at dusk",
    crop: { x: 0.2, y: 0.13, width: 0.6 },
    subject: { x: 0.49, y: 0.37 },
    place: "Amsterdam, NL",
  },
  crewId: "RK-2099",
  status: "open to collaborations",
  bio: "I'm an MSc Computer Science student at Universität Paderborn, building machine-learning and LLM systems — from retrieval pipelines to explainable models. I love work where careful engineering meets curiosity, and ideas grow into something people can actually use.",
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
// Studies (Learning Orbit): what you've studied and are studying now at
// Universität Paderborn. Each entry becomes a planet:
//   type     "course" | "seminar" | "project"  → which orbit it circles on
//   status   "current" (studying now: a pulsing halo) | "completed"
//   writeup  2–4 sentences on what you worked on or learned
//   topics   optional short chips
//   short    optional shorter name for the planet's label in the orbit
//   subtitle optional line under the title (team, supervisor, paper…)
//   phases   optional [{ title, status, text }] for multi-part work
//   progress optional { done, total, unit } → a progress bar ("1 of 2 semesters")
//   stats    optional [{ value, label }] → up to three highlight tiles
export const studies = [
  {
    type: "project",
    title: "How to Train Your LLM 2 (HTYLLM2)",
    short: "HTYLLM2",
    status: "current",
    subtitle: "Team of 9 · DICE group, Heinz Nixdorf Institut · supervised by Prof. Dr. Axel Ngonga",
    writeup:
      "A two-semester research project in a team of nine. Most of the world's ~7,000 languages are barely served by large language models, and adding more languages to one model can even make it worse. We're studying how to close that gap efficiently.",
    phases: [
      {
        title: "Phase 1 · One model, 198 languages",
        status: "completed",
        text: "Can one frozen Llama-3.2-1B be adapted cheaply to serve 198 languages? We compared three adapter-based expert architectures on the HPLT corpus. I worked on Hybrid Cluster Experts: routing each text by its Glot500 embedding instead of a language ID, with one LoRA expert per semantic cluster (50 experts for 198 languages). It gave the largest gain of the three approaches: 49.7% lower perplexity when deployed and 56% on low-resource languages, with no catastrophic forgetting.",
      },
      {
        title: "Phase 2 · Scaling laws across architectures",
        status: "current",
        text: "Now we're studying how multilingual language models scale across five architectures, from dense Transformers to Mamba, on a compute budget of 15,000 H100 GPU hours.",
      },
    ],
    progress: { done: 1, total: 2, unit: "semesters" },
    stats: [
      { value: "198", label: "languages" },
      { value: "49.7%", label: "lower perplexity" },
      { value: "15k", label: "H100 hours" },
    ],
    topics: ["LLMs", "LoRA", "Multilingual NLP", "Scaling laws", "PyTorch"],
  },
  {
    type: "seminar",
    title: "Seminar: Debate-to-Write",
    short: "Debate-to-Write",
    status: "completed",
    subtitle: "Individual research seminar · critical review of Hu et al., COLING 2025",
    writeup:
      "An independent study and critical review of Debate-to-Write, a persona-driven multi-agent framework in which LLM agents with distinct personas debate a topic before writing an argumentative essay, to make the output more diverse. I reconstructed its three stages (persona assignment, debate-driven planning and argument writing), its Perspective Diversity metric and its evaluation, then examined its weaknesses: LLM judges grading their own model family, a small human study, personas as role-play rather than real reasoning diversity, and unreported cost. I proposed extensions such as knowledge-grounded debate and persona bias audits, and presented the work in a written report and a talk.",
    topics: ["Multi-agent LLMs", "Persona prompting", "Argument generation", "LLM evaluation"],
  },
  {
    type: "course",
    title: "Machine Learning 1",
    status: "current",
    writeup:
      "The foundations of machine learning: how models learn from data and how to judge them fairly. Working through supervised learning — linear and logistic regression, support vector machines and neural networks — together with regularisation, model selection and evaluation.",
    topics: ["Supervised learning", "Neural networks", "Model evaluation"],
  },
  {
    type: "course",
    title: "Introduction to Quantum Computation",
    short: "Quantum Computation",
    status: "current",
    writeup:
      "Quantum computing from a computer-science point of view. Learning the postulates of quantum mechanics, how entanglement works as a resource, and how to design and analyse fundamental quantum algorithms — along with quantum error correction and the basics of quantum information theory, such as entropy.",
    topics: ["Qubits", "Entanglement", "Quantum algorithms", "Error correction"],
  },
  {
    type: "course",
    title: "Post-Quantum Cryptography",
    status: "current",
    writeup:
      "Shor's algorithm would break RSA, ElGamal and DSA on a large enough quantum computer, so this course looks at what replaces them. Studying codes, lattices and discretised Gaussian distributions, and the lattice- and code-based encryption, signatures and zero-knowledge proofs built on them — including how to prove their security.",
    topics: ["Lattices", "Code-based crypto", "Signatures", "Zero-knowledge"],
  },
  {
    type: "course",
    title: "Explainable Artificial Intelligence",
    short: "Explainable AI",
    status: "completed",
    writeup:
      "Why a model's predictions need explaining, and how to do it. I worked with inherently interpretable models (linear models, decision trees and rules), global methods such as partial dependence plots and permutation feature importance, local ones such as LIME, Anchors, SHAP and counterfactuals, and methods made for neural networks. I implemented simple explainers from scratch and, in the mini-project, explained a Fast R-GCN on the MUTAG dataset with GNNExplainer.",
    topics: ["SHAP", "LIME", "Counterfactuals", "GNNExplainer"],
  },
  {
    type: "course",
    title: "Multi-Objective Optimisation",
    status: "completed",
    writeup:
      "Real problems rarely have one goal — the shortest route is often not the cheapest. I learned to find sets of optimal compromises (Pareto-optimal solutions): exact algorithms for multi-criteria minimum spanning tree and shortest path problems and their limits, nature-inspired evolutionary heuristics, how to measure and visualise the quality of the results, and what changes with more than three objectives.",
    topics: ["Pareto optimality", "Evolutionary algorithms", "Many-objective"],
  },
  {
    type: "course",
    title: "Data-Driven Innovation",
    status: "completed",
    writeup:
      "How data changes the way companies innovate. I studied the fundamentals of innovation management and of data in organisations, data-driven offerings — smart products and services, digital platforms, data spaces and digital business models — and data-infused innovation processes, then applied the methods in the tutorials to find, shape and test ideas towards a market.",
    topics: ["Innovation management", "Business models", "Digital platforms"],
  },
  {
    type: "course",
    title: "Machine Learning for Biometrics",
    short: "ML for Biometrics",
    status: "completed",
    writeup:
      "How machine learning recognises people by their face, iris or fingerprint, and what makes biometric systems trustworthy. Alongside evaluating biometric systems and training recognition models on facial data in the exercises, I studied fairness and bias, privacy and soft biometrics, explainability and confidence, sample quality, and detecting presentation attacks.",
    topics: ["Face recognition", "Fairness", "Attack detection", "Privacy"],
  },
  {
    type: "course",
    title: "Data Science for Software Engineering",
    short: "Data Science for SE",
    status: "completed",
    writeup:
      "Applying data science to the data software teams produce — code in version control, issues, mailing lists and forums. I used clustering of source code, NLP pipelines, topic modelling, word embeddings, information retrieval and supervised learning, and in group assignments analysed open-source systems for architecture and maintenance tasks, reporting and presenting the results scientifically.",
    topics: ["Topic modelling", "NLP", "Software repositories", "Statistics"],
  },
  {
    type: "course",
    title: "Unsupervised Learning and Evolutionary Optimisation Using R",
    short: "Unsupervised Learning (R)",
    status: "completed",
    writeup:
      "Finding structure in data without labels, implemented in R. I worked on data pre-processing and data quality, clustering (including stream clustering) and dimensionality reduction, and on the principles of single- and multi-objective evolutionary optimisation — applying them in individual and group work and assessing the quality of the results.",
    topics: ["R", "Clustering", "Dimensionality reduction", "Evolutionary optimisation"],
  },
];

// `github`: the project's repository (a "GitHub" link under the project and
// in its project file). Leave it out for projects without a public repo.
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
    github: "https://github.com/ramneekkaur/XAI_Mini_Project_SS2025",
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
    github: "https://github.com/ramneekkaur/My-Portfolio",
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

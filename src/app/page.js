import Link from "next/link";
import CosmicScene from "@/components/scene/CosmicScene";
import Hero from "@/components/Hero";
import Letterbox from "@/components/Letterbox";
import ChapterNav from "@/components/ChapterNav";
import WarpStreaks from "@/components/WarpStreaks";
import SignalBeam from "@/components/SignalBeam";
import SeedLander from "@/components/SeedLander";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import NeuralGarden from "@/components/NeuralGarden";
import QuantumRoots from "@/components/QuantumRoots";
import GrowthRings from "@/components/GrowthRings";
import ProjectConstellation from "@/components/ProjectConstellation";
import ContactForm from "@/components/ContactForm";
import SignalChannels from "@/components/SignalChannels";
import NatureBackdrop from "@/components/NatureBackdrop";
import GardenPortal from "@/components/GardenPortal";
import InterestRoots from "@/components/InterestRoots";
import { chapter } from "@/lib/chapters";
import { profile, skills, timeline, projects, researchInterests, languages } from "@/data/profile";

export default function Home() {
  return (
    <main className="text-white overflow-x-clip">
      <CosmicScene />
      <ChapterNav />
      <WarpStreaks />
      <SignalBeam />

      {/* Hero – Cosmic Seed */}
      <Letterbox />
      <Hero />

      {/* Neural Garden */}
      <section id="neural-garden" data-realm="tech" className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-6xl mx-auto">
          <SectionHeader chapter={chapter("neural-garden")}>
            Four years of building software, machine learning and AI-driven
            systems — with a growing focus on LLM applications. Every skill is a
            species in this garden, growing from the same roots.
          </SectionHeader>

          <NeuralGarden skills={skills} />
        </div>
      </section>

      {/* Growth Rings – experience, education & volunteering */}
      <section id="growth-rings" data-realm="tech" className="px-6 py-28">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("growth-rings")}>
            Every season of work and study leaves a ring. This is how the
            garden grew — from data analysis to leading teams to teaching AI.
          </SectionHeader>

          <GrowthRings entries={timeline} />
        </div>
      </section>

      {/* Constellation Projects */}
      <section id="projects" data-realm="tech" className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-6xl mx-auto">
          <SectionHeader chapter={chapter("projects")}>
            Each project is a star in a growing system of experiments,
            questions, and discoveries.
          </SectionHeader>

          <ProjectConstellation projects={projects} />
        </div>
      </section>

      {/* Quantum Roots */}
      <section id="quantum-roots" data-realm="tech" className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("quantum-roots")}>
            The most powerful systems grow where we cannot see.
          </SectionHeader>

          <Reveal className="panel mt-16 p-8 pt-10 md:p-12">
            <p className="panel-title">[ Transmission log ]</p>
            <p className="term-label mb-4">Philosophy</p>
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Quantum computing fascinates me because it challenges ordinary
              thinking. It teaches that reality can be probabilistic, layered,
              and deeply interconnected.
            </p>

            <p className="term-label mb-4 mt-10">What drives me</p>
            <p className="glow-text text-xl md:text-2xl leading-snug">
              I want my work to reflect that same curiosity — building systems
              that are not only functional, but also imaginative.
            </p>
          </Reveal>

          {/* The surface: above it the visible, below it what grows unseen */}
          <div className="quantum-surface mt-24">
            <span className="absolute -top-2 right-0 bg-space px-2 text-[0.58rem] uppercase tracking-[0.3em] text-bloom/70">
              [ Surface ]
            </span>
          </div>

          <div className="relative isolate pb-8">
            <QuantumRoots />
            <p data-tone="nature" className="term-label mb-2 text-center">Research interests · hover to observe</p>
            <InterestRoots interests={researchInterests} />
          </div>
        </div>
      </section>

      {/* Nature & Vision */}
      <section id="nature" data-realm="nature" className="relative isolate min-h-screen px-6 py-40 flex items-center">
        <NatureBackdrop />

        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("nature")}>
            Technology should not dominate nature. It should grow with it.
          </SectionHeader>

          <Reveal className="mt-16 grid md:grid-cols-2 gap-6">
            <div data-tone="nature" className="panel p-8 pt-10">
              <p className="panel-title">[ Field note 01 ]</p>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-4">
                Gardening & Growth
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Gardening reminds me that complex systems need patience,
                attention, and care. Intelligence, like nature, grows through
                structure and time.
              </p>
            </div>

            <div data-tone="tech" className="panel p-8 pt-10">
              <p className="panel-title">[ Field note 02 ]</p>
              <h3 className="font-display text-lg font-bold uppercase tracking-wide mb-4">
                Science Fiction & Space
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Space and science fiction give me a language for possibility —
                a way to imagine futures where computation, life, and curiosity
                expand together.
              </p>
            </div>
          </Reveal>

          <GardenPortal />
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("contact")}>
            If you want to collaborate, discuss ideas, or explore intelligent
            systems together, transmit a message.
          </SectionHeader>

          <div className="mt-16 grid gap-14 md:grid-cols-[1fr_1.4fr] md:gap-16">
            <SignalChannels profile={profile} languages={languages} />
            <ContactForm />
          </div>
        </div>
      </section>

      {/* A small mission to end on */}
      <section id="mission" className="px-6 pb-28">
        <div className="w-full max-w-5xl mx-auto">
          <SeedLander />
        </div>
      </section>

      <footer className="px-6 pb-12 text-center text-[0.65rem] uppercase tracking-[0.3em] text-gray-500">
        <span aria-hidden="true">&gt; </span>
        {profile.name} · Cultivated in {profile.location.split(",")[0]} · © {new Date().getFullYear()} ·{" "}
        <Link href="/garden" className="underline decoration-white/20 underline-offset-4 hover:text-white">
          Garden world
        </Link>
      </footer>
    </main>
  );
}

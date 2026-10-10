import CosmicScene from "@/components/scene/CosmicScene";
import Hero from "@/components/Hero";
import Letterbox from "@/components/Letterbox";
import ChapterNav from "@/components/ChapterNav";
import Reveal from "@/components/Reveal";
import SectionHeader from "@/components/SectionHeader";
import NeuralGarden from "@/components/NeuralGarden";
import QuantumRoots from "@/components/QuantumRoots";
import GrowthRings from "@/components/GrowthRings";
import ProjectConstellation from "@/components/ProjectConstellation";
import ContactForm from "@/components/ContactForm";
import SignalChannels from "@/components/SignalChannels";
import NatureBackdrop from "@/components/NatureBackdrop";
import NatureGallery from "@/components/NatureGallery";
import InterestRoots from "@/components/InterestRoots";
import ResumeChart from "@/components/ResumeChart";
import { chapter } from "@/lib/chapters";
import { profile, skills, timeline, projects, interests, languages, naturePhotos } from "@/data/profile";

export default function Home() {
  return (
    <main className="text-white overflow-x-clip">
      <CosmicScene />
      <ChapterNav />

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
      <section id="quantum-roots" data-realm="tech" className="relative isolate min-h-screen px-6 py-28 flex items-center">
        <QuantumRoots />

        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("quantum-roots")}>
            The most powerful systems grow where we cannot see.
          </SectionHeader>

          <Reveal className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 backdrop-blur-sm">
            <p className="mb-4 text-[0.65rem] uppercase tracking-[0.35em] text-electric">Philosophy</p>
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              Quantum computing fascinates me because it challenges ordinary
              thinking. It teaches that reality can be probabilistic, layered,
              and deeply interconnected.
            </p>

            <p className="mb-4 mt-10 text-[0.65rem] uppercase tracking-[0.35em] text-electric">What drives me</p>
            <p className="glow-text text-2xl md:text-3xl font-light leading-snug">
              I want my work to reflect that same curiosity — building systems
              that are not only functional, but also imaginative.
            </p>
          </Reveal>

          <p className="mb-2 mt-20 text-center text-[0.65rem] uppercase tracking-[0.35em] text-bloom">
            Research interests
          </p>
          <InterestRoots interests={interests} />
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
            <div className="rounded-3xl border border-bloom/10 bg-bloom/[0.04] p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Gardening & Growth
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Gardening reminds me that complex systems need patience,
                attention, and care. Intelligence, like nature, grows through
                structure and time.
              </p>
            </div>

            <div className="rounded-3xl border border-electric/10 bg-electric/[0.04] p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Science Fiction & Space
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Space and science fiction give me a language for possibility —
                a way to imagine futures where computation, life, and curiosity
                expand together.
              </p>
            </div>
          </Reveal>

          <NatureGallery photos={naturePhotos} />
        </div>
      </section>

      {/* Résumé – the whole star chart, to download */}
      <section id="resume" className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader chapter={chapter("resume")}>
            Skills, experience, education and projects — everything above,
            charted on two pages.
          </SectionHeader>

          <ResumeChart resume={profile.resume} />
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

      <footer className="px-6 pb-12 text-center text-[0.65rem] uppercase tracking-[0.35em] text-gray-500">
        {profile.name} · Cultivated in {profile.location.split(",")[0]} · © {new Date().getFullYear()}
      </footer>
    </main>
  );
}

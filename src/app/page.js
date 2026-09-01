"use client";

import { motion } from "framer-motion";
import Starfield from "@/components/Starfield";
import SeedOrb from "@/components/SeedOrb";
import SectionHeader from "@/components/SectionHeader";
import SkillCard from "@/components/SkillCard";
import ProjectCard from "@/components/ProjectCard";
import ContactForm from "@/components/ContactForm";
import { skills, projects } from "@/data/profile";

export default function Home() {
  return (
    <main className="cosmic-bg text-white overflow-hidden">
      <Starfield />

      {/* Hero */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5 }}
        className="min-h-screen flex flex-col items-center justify-center text-center px-6"
      >
        <SeedOrb />

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2.2, delay: 1 }}
          className="text-4xl md:text-7xl font-bold glow-text max-w-5xl mt-10"
        >
          Cultivating Intelligence Across the Cosmos
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 2, delay: 1.6 }}
          className="text-lg text-gray-400 max-w-xl mt-6"
        >
          Exploring AI, Quantum Systems, and the Cosmos — inspired by Nature.
        </motion.p>
      </motion.section>

      {/* Neural Ecosystem */}
      <section className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Section 01"
            title="Neural Ecosystem"
          >
            I explore intelligent systems as living networks — where algorithms,
            data, and curiosity grow like roots beneath the surface.
          </SectionHeader>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
            {skills.map((skill) => (
              <SkillCard
                key={skill.title}
                title={skill.title}
                description={skill.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Quantum Roots */}
      <section className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Section 02"
            title="Quantum Roots"
          >
            The most powerful systems grow where we cannot see.
          </SectionHeader>

          <motion.div
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 backdrop-blur-sm"
          >
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
              Quantum computing fascinates me because it challenges ordinary
              thinking. It teaches that reality can be probabilistic, layered,
              and deeply interconnected. I want my work to reflect that same
              curiosity — building systems that are not only functional, but
              also imaginative.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects */}
      <section className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="Section 03"
            title="Constellations of Work"
          >
            Each project is a star in a growing system of experiments,
            questions, and discoveries.
          </SectionHeader>

          <div className="grid md:grid-cols-3 gap-6 mt-16">
            {projects.map((project) => (
              <ProjectCard
                key={project.title}
                title={project.title}
                type={project.type}
                description={project.description}
                status={project.status}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Nature & Vision */}
      <section className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Section 04"
            title="Nature & Vision"
          >
            Technology should not dominate nature. It should grow with it.
          </SectionHeader>

          <motion.div
            initial={{ opacity: 0, y: 70 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
            viewport={{ once: true, amount: 0.3 }}
            className="mt-16 grid md:grid-cols-2 gap-6"
          >
            <div className="rounded-3xl border border-emerald-300/10 bg-emerald-300/[0.04] p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Gardening & Growth
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Gardening reminds me that complex systems need patience,
                attention, and care. Intelligence, like nature, grows through
                structure and time.
              </p>
            </div>

            <div className="rounded-3xl border border-blue-300/10 bg-blue-300/[0.04] p-8">
              <h3 className="text-2xl font-semibold mb-4">
                Science Fiction & Space
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Space and science fiction give me a language for possibility —
                a way to imagine futures where computation, life, and curiosity
                expand together.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Contact */}
      <section className="min-h-screen px-6 py-28 flex items-center">
        <div className="w-full max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Final Transmission"
            title="Send a Signal"
          >
            If you want to collaborate, discuss ideas, or explore intelligent
            systems together, transmit a message.
          </SectionHeader>

          <div className="mt-16">
            <ContactForm />
          </div>
        </div>
      </section>
    </main>
  );
}
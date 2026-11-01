"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";
import StarPortrait from "@/components/StarPortrait";
import Typewriter from "@/components/Typewriter";
import { scrollToSection } from "@/lib/smoothScroll";

const initialsOf = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

// About: a mission crew ID. The portrait is made of stars that settle into
// the photo (or the initials, until a photo is added); beside it, the dossier.
export default function CrewProfile({ profile, photo }) {
  const [scan, setScan] = useState(0); // restarts the ID scan line

  const fields = [
    ["Role", profile.role],
    ["Base", profile.location],
    ["Studies", profile.studies],
  ];

  return (
    <div className="mt-16 grid items-center gap-12 md:grid-cols-[minmax(0,26rem)_1fr] md:gap-16">
      <Reveal className="mx-auto w-full max-w-[26rem]">
        <figure className="panel crew-frame p-3 pt-8">
          <figcaption className="absolute inset-x-3 top-2.5 flex justify-between text-[0.55rem] uppercase tracking-[0.3em] text-gray-500">
            <span className="text-phosphor">Crew 01</span>
            <span>ID · {profile.crewId}</span>
          </figcaption>
          <div className="relative">
            <StarPortrait photo={photo} initials={initialsOf(profile.name)} onScan={() => setScan((n) => n + 1)} />
            {scan > 0 && <span key={scan} aria-hidden="true" className="crew-scan" />}
          </div>
          <p className="mt-3 flex justify-between text-[0.55rem] uppercase tracking-[0.3em] text-gray-500">
            <span>{photo?.place ? `◎ ${photo.place}` : "Signal lock"}</span>
            <span className="text-phosphor">
              <span aria-hidden="true" className="crew-status-dot" /> Online
            </span>
          </p>
        </figure>
      </Reveal>

      <Reveal className="space-y-8">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.35em] text-gray-500">Crew dossier</p>
          <h3 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl">{profile.name}</h3>
        </div>

        <dl className="space-y-3 border-y border-white/10 py-5 text-sm">
          {fields.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[6.5rem_1fr] gap-3">
              <dt className="pt-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">{label}</dt>
              <dd className="text-gray-200">
                <Typewriter text={value} />
              </dd>
            </div>
          ))}
          <div className="grid grid-cols-[6.5rem_1fr] gap-3">
            <dt className="pt-0.5 text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">Status</dt>
            <dd className="text-phosphor">
              <span aria-hidden="true" className="crew-status-dot" /> Online · {profile.status}
            </dd>
          </div>
        </dl>

        <p className="max-w-xl text-sm leading-relaxed text-gray-300 md:text-base">{profile.bio}</p>

        <div className="flex flex-wrap gap-3">
          <a href={profile.resume.href} download={profile.resume.fileName} className="resume-download btn-terminal btn-terminal-primary">
            <span aria-hidden="true" className="resume-download-icon">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M3 13.5 H13" />
              </svg>
            </span>
            Download résumé
          </a>
          <button type="button" onClick={() => scrollToSection("contact")} className="btn-terminal">
            Send a signal ↓
          </button>
        </div>
      </Reveal>
    </div>
  );
}

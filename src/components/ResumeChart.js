import { statSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import Reveal from "@/components/Reveal";

const CONTENTS = [
  "Four years of experience in machine learning and AI-driven systems",
  "Education — MSc Computer Science and BTech Computer Science & Engineering",
  "Projects, technical skills, volunteering and languages",
];

// File size read from the PDF itself at build time, so it is always accurate.
function fileSize(href) {
  try {
    const bytes = statSync(path.join(process.cwd(), "public", href)).size;
    return `${Math.round(bytes / 1024)} KB`;
  } catch {
    return null;
  }
}

// The downloadable CV: "the whole star chart, to take with you".
export default function ResumeChart({ resume }) {
  const size = fileSize(resume.href);
  const details = ["PDF", `${resume.pages} pages`, size, `Updated ${resume.updated}`].filter(Boolean);

  return (
    <div className="mt-16 grid items-center gap-14 md:grid-cols-[minmax(0,0.85fr)_1fr] md:gap-16">
      {/* Preview: page one, with page two peeking out behind it */}
      <Reveal>
        <a
          href={resume.href}
          target="_blank"
          rel="noreferrer"
          data-cursor="interactive"
          aria-label="Open the résumé in a new tab"
          className="resume-preview group relative mx-auto block w-full max-w-sm outline-none"
        >
          <span aria-hidden="true" className="resume-sheet resume-sheet-back" />
          <span className="resume-sheet resume-sheet-front">
            <Image
              src={resume.preview.src}
              alt="Preview of the first page of Ramneek Kaur's résumé"
              width={resume.preview.width}
              height={resume.preview.height}
              sizes="(min-width: 768px) 24rem, 90vw"
              className="h-auto w-full"
            />
            <span className="resume-preview-hint">Open preview ↗</span>
          </span>
        </a>
      </Reveal>

      <Reveal className="text-center md:text-left">
        <p className="text-2xl font-light leading-snug md:text-3xl">
          The whole journey on two pages — take the map with you.
        </p>

        <ul className="mt-8 space-y-3 text-left text-gray-400">
          {CONTENTS.map((item) => (
            <li key={item} className="flex gap-3">
              <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-electric shadow-[0_0_8px_var(--color-electric)]" />
              {item}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap justify-center gap-4 md:justify-start">
          <a
            href={resume.href}
            download={resume.fileName}
            className="resume-download group inline-flex items-center gap-3 rounded-full bg-white px-7 py-4 font-medium text-black transition hover:bg-electric"
          >
            <span aria-hidden="true" className="resume-download-icon">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M3 13.5 H13" />
              </svg>
            </span>
            Download résumé
          </a>
          <a
            href={resume.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-4 text-gray-300 transition-colors hover:border-electric/40 hover:text-white"
          >
            Open in browser <span aria-hidden="true">↗</span>
          </a>
        </div>

        <p className="mt-5 text-[0.65rem] uppercase tracking-[0.3em] text-gray-500">{details.join(" · ")}</p>
      </Reveal>
    </div>
  );
}

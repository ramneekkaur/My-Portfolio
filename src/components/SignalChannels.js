import { statSync } from "node:fs";
import path from "node:path";
import Reveal from "@/components/Reveal";

// File size read from the PDF itself at build time, so it is always accurate.
function fileSize(href) {
  try {
    const bytes = statSync(path.join(process.cwd(), "public", href)).size;
    return `${Math.round(bytes / 1024)} KB`;
  } catch {
    return null;
  }
}

function Label({ children }) {
  return <p className="term-label mb-3">{children}</p>;
}

// Ramneek's personal details: email addresses, résumé, profiles and the
// languages ("frequencies") she speaks.
export default function SignalChannels({ profile, languages }) {
  const { resume } = profile;
  const details = ["PDF", `${resume.pages} pages`, fileSize(resume.href), `Updated ${resume.updated}`].filter(Boolean);

  return (
    <Reveal className="space-y-10">
      <div>
        <Label>Direct_channels</Label>
        <ul className="space-y-4">
          {profile.emails.map((email) => (
            <li key={email.address}>
              <span className="block text-[0.65rem] uppercase tracking-[0.25em] text-gray-500">{email.label}</span>
              <a
                href={`mailto:${email.address}`}
                className="text-base text-white underline decoration-phosphor/30 underline-offset-8 transition-colors [overflow-wrap:anywhere] hover:decoration-phosphor md:text-lg"
              >
                {email.address}
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm text-gray-400">{profile.location}</p>
      </div>

      <div>
        <Label>Résumé</Label>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={resume.href}
            download={resume.fileName}
            className="resume-download btn-terminal btn-terminal-primary"
          >
            <span aria-hidden="true" className="resume-download-icon">
              <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 2 V10 M4.5 6.5 L8 10 L11.5 6.5 M3 13.5 H13" />
              </svg>
            </span>
            Download résumé
          </a>
          <a href={resume.href} target="_blank" rel="noreferrer" className="btn-terminal">
            Open <span aria-hidden="true">↗</span>
          </a>
        </div>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.3em] text-gray-500">{details.join(" · ")}</p>
      </div>

      <div>
        <Label>Orbits</Label>
        <ul className="flex flex-wrap gap-3">
          {profile.links.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noreferrer" className="btn-terminal">
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <Label>Frequencies</Label>
        <ul className="max-w-sm space-y-2 text-xs uppercase tracking-wider">
          {languages.map((language) => (
            <li key={language.name} className="flex items-baseline gap-2">
              <span className="text-white">{language.name}</span>
              <span aria-hidden="true" className="flex-1 border-b border-dotted border-phosphor/30" />
              <span className="text-phosphor">{language.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

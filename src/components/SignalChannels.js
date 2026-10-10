import Reveal from "@/components/Reveal";

// Direct ways to reach Ramneek, and the languages ("frequencies") she speaks.
export default function SignalChannels({ profile, languages }) {
  return (
    <Reveal className="space-y-10">
      <div>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.4em] text-electric">Direct channel</p>
        <a
          href={`mailto:${profile.email}`}
          className="break-all text-xl text-white underline decoration-white/20 underline-offset-8 transition-colors hover:decoration-electric md:text-2xl"
        >
          {profile.email}
        </a>
        <p className="mt-4 text-sm text-gray-400">{profile.location}</p>
      </div>

      <div>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.4em] text-electric">Orbits</p>
        <ul className="flex flex-wrap gap-3">
          <li>
            <a
              href={profile.resume.href}
              download={profile.resume.fileName}
              className="inline-flex items-center gap-2 rounded-full border border-electric/30 px-5 py-2.5 text-sm text-electric transition-colors hover:border-electric/60 hover:text-white"
            >
              Résumé
              <span aria-hidden="true">↓</span>
            </a>
          </li>
          {profile.links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-2.5 text-sm text-gray-300 transition-colors hover:border-electric/40 hover:text-white"
              >
                {link.label}
                <span aria-hidden="true">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-3 text-[0.65rem] uppercase tracking-[0.4em] text-electric">Frequencies</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-3">
          {languages.map((language) => (
            <li key={language.name}>
              <span className="text-white">{language.name}</span>
              <span className="block text-xs text-gray-500">{language.level}</span>
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

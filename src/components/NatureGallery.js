import Image from "next/image";
import Reveal from "@/components/Reveal";

// Shown only in development while no photos have been added, so the layout
// can be previewed. The live site shows nothing until real photos exist.
const PLACEHOLDERS = [
  { aspect: "3 / 4", label: "Garden photo" },
  { aspect: "1 / 1", label: "Macro flower" },
  { aspect: "4 / 5", label: "Leaf texture" },
];

// Minimal, artistic photo gallery for Nature & Vision (masonry columns).
// Photos are listed in src/data/profile.js → naturePhotos.
export default function NatureGallery({ photos }) {
  if (photos.length === 0) {
    if (process.env.NODE_ENV === "production") return null;

    return (
      <Reveal className="mt-16 columns-2 md:columns-3 gap-4">
        {PLACEHOLDERS.map((placeholder) => (
          <div
            key={placeholder.label}
            style={{ aspectRatio: placeholder.aspect }}
            className="mb-4 flex break-inside-avoid items-center justify-center rounded-2xl border border-dashed border-bloom/25 bg-gradient-to-br from-bloom/[0.06] to-moss/[0.04] text-xs uppercase tracking-[0.3em] text-bloom/60"
          >
            {placeholder.label}
          </div>
        ))}
      </Reveal>
    );
  }

  return (
    <Reveal className="mt-16 columns-2 md:columns-3 gap-4">
      {photos.map((photo) => (
        <figure
          key={photo.src}
          className="group mb-4 break-inside-avoid overflow-hidden rounded-2xl border border-bloom/10"
        >
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width}
            height={photo.height}
            sizes="(min-width: 768px) 33vw, 50vw"
            className="h-auto w-full object-cover opacity-85 saturate-[0.85] transition duration-[1200ms] group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100"
          />
          {photo.caption && (
            <figcaption className="px-4 py-3 text-xs tracking-wide text-gray-400">
              {photo.caption}
            </figcaption>
          )}
        </figure>
      ))}
    </Reveal>
  );
}

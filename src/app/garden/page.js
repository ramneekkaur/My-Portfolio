import Link from "next/link";
import GardenWorld from "@/components/garden/GardenWorld";
import Moments, { MomentsLink } from "@/components/garden/Moments";
import Reveal from "@/components/Reveal";
import { interests, profile } from "@/data/profile";
import { listPosts } from "@/lib/supabaseServer";

export const metadata = {
  title: "Garden World — Ramneek Kaur",
  description:
    "Beyond the code: nature, travelling, technology, space, photography and science fiction — Ramneek Kaur's interests on a blossoming planet.",
};

// Moments refresh immediately after posting (revalidatePath); this is a fallback.
export const revalidate = 300;

export default async function GardenPage() {
  const posts = await listPosts();
  const count = (id) => posts.filter((post) => post.interest === id).length;

  return (
    <main data-realm="nature" className="text-white overflow-x-clip">
      <GardenWorld interests={interests} posts={posts} />

      {/* The same interests as a list, for every device and reader */}
      <section id="interests" className="garden-ground px-6 py-24">
        <div className="mx-auto w-full max-w-5xl">
          <p data-tone="nature" className="term-label text-center">
            Everything growing here
          </p>
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {interests.map((interest, i) => (
              <li key={interest.id}>
                <Reveal data-tone="nature" className="panel h-full p-6 pt-8">
                  <p className="panel-title">[ Blossom {String(i + 1).padStart(2, "0")} ]</p>
                  <h2 className="font-display text-base font-bold uppercase tracking-wide md:text-lg">
                    <span aria-hidden="true" className="mr-2 text-blossom">❀</span>
                    {interest.title}
                  </h2>
                  <p className="mt-2 text-sm text-blossom-light/80">{interest.summary}</p>
                  <p className="mt-4 text-sm leading-relaxed text-gray-400">{interest.story}</p>
                  <MomentsLink interestId={interest.id} count={count(interest.id)} />
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Moments: every hobby's posts */}
      <section id="moments" className="garden-ground scroll-mt-8 px-6 pb-28 pt-8">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center">
            <p data-tone="nature" className="term-label">
              Field notes
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl glow-text">
              Moments
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-gray-400">
              Trails, flowers, places and quiet details — a few moments from every corner of my world.
            </p>
          </div>
          <Moments posts={posts} interests={interests} />
        </div>
      </section>

      <footer className="px-6 pb-12 text-center">
        <Link href="/#nature" className="btn-terminal">
          ← Return to orbit
        </Link>
        <p className="mt-8 text-[0.65rem] uppercase tracking-[0.3em] text-gray-500">
          {profile.name} · Garden World · © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}

import Link from "next/link";
import LoginForm from "@/components/garden/LoginForm";
import Uploader from "@/components/garden/Uploader";
import { authConfigured, isOwner } from "@/lib/gardenSession";
import { interests } from "@/data/profile";
import { listPosts, storageConfigured } from "@/lib/supabaseServer";

export const metadata = {
  title: "Upload — Garden World",
  robots: { index: false, follow: false },
};

// Always rendered fresh: it depends on the visitor's session cookie.
export const dynamic = "force-dynamic";

const SETUP_KEYS = [
  ["NEXT_PUBLIC_SUPABASE_URL", "Supabase → Project settings → API → Project URL"],
  ["NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase → Project settings → API → anon / publishable key"],
  ["SUPABASE_SERVICE_ROLE_KEY", "Supabase → Project settings → API → service_role key (keep secret)"],
  ["GARDEN_UPLOAD_PASSWORD", "A strong password you choose for this page"],
  ["GARDEN_SESSION_SECRET", "A long random string (e.g. from: openssl rand -base64 32)"],
];

function SetupNotice() {
  const missing = SETUP_KEYS.filter(([key]) => !process.env[key]);
  return (
    <div className="panel mx-auto mt-12 max-w-2xl p-6 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ Setup required ]</p>
      <p className="text-sm text-gray-300">
        Photo uploads need a free Supabase project. Run <code className="text-phosphor">supabase/garden-setup.sql</code>{" "}
        in its SQL editor, then add these to <code className="text-phosphor">.env.local</code> (and to your host&apos;s
        environment variables), and restart the server:
      </p>
      <ul className="mt-6 space-y-3 text-xs">
        {SETUP_KEYS.map(([key, hint]) => (
          <li key={key}>
            <span className={missing.some(([m]) => m === key) ? "text-white" : "text-bloom"}>
              {missing.some(([m]) => m === key) ? "○" : "●"} {key}
            </span>
            <span className="block text-gray-500">{hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function UploadPage() {
  const configured = authConfigured() && storageConfigured() && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const owner = configured && (await isOwner());
  const posts = owner ? await listPosts() : [];

  return (
    <main data-realm="nature" className="garden-ground min-h-screen px-6 py-24 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <Link href="/garden" className="btn-terminal">
          ← Garden World
        </Link>
        <h1 className="mt-10 font-display text-3xl font-bold uppercase tracking-wide md:text-4xl glow-text">
          Share a Moment
        </h1>
        <p className="mt-3 text-sm text-gray-400">Private · share moments from every hobby to the Garden World.</p>

        {!configured ? <SetupNotice /> : owner ? <Uploader interests={interests} initialPosts={posts} /> : <LoginForm />}
      </div>
    </main>
  );
}

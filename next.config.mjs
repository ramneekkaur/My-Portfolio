import { fileURLToPath } from "node:url";

// Photos in the Garden World gallery are served from Supabase Storage
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  // Pin the project root — a stray lockfile in the parent folder otherwise
  // makes Next.js pick the wrong workspace root.
  turbopack: {
    root: fileURLToPath(new URL(".", import.meta.url)),
  },
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;

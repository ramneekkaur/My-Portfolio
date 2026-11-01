import "server-only";
import { createClient } from "@supabase/supabase-js";
import { sortPosts } from "./moments";

// Server-side access to the Garden World moments (Supabase). The service
// role key never leaves the server. See supabase/garden-setup.sql.

export const PHOTO_BUCKET = "photos";

export function storageConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabaseAdmin() {
  if (!storageConfigured()) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function publicPhotoUrl(supabase, path) {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

// All posts, newest first, each with its photos in order and their public URLs.
// Never throws: a missing or unreachable store simply shows no moments.
export async function listPosts() {
  const supabase = supabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("posts")
    .select("id, interest, caption, place, taken_on, created_at, photos(id, path, width, height, position)");

  if (error) {
    console.error("Garden moments: could not list posts —", error.message);
    return [];
  }
  return sortPosts(
    data
      .filter((post) => post.photos.length > 0)
      .map((post) => ({
        ...post,
        photos: [...post.photos]
          .sort((a, b) => a.position - b.position)
          .map((photo) => ({ ...photo, url: publicPhotoUrl(supabase, photo.path) })),
      }))
  );
}

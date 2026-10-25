import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/gardenSession";
import { readPostFields, readPostPhotos } from "@/lib/postInput";
import { PHOTO_BUCKET, publicPhotoUrl, supabaseAdmin } from "@/lib/supabaseServer";

// Shares a new post whose photos were just uploaded to storage, then refreshes
// the Garden World. If saving fails, the uploaded files are removed again.
export async function POST(request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Photo storage is not configured yet." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { fields, error: fieldError } = readPostFields(body);
  if (fieldError) return NextResponse.json({ error: fieldError }, { status: 400 });
  const { photos, error: photoError } = readPostPhotos(body.photos);
  if (photoError) return NextResponse.json({ error: photoError }, { status: 400 });

  const discardFiles = () => supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path));

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert(fields)
    .select("id, interest, caption, place, taken_on, created_at")
    .single();
  if (postError) {
    console.error("Garden moments: could not save post —", postError.message);
    await discardFiles();
    return NextResponse.json({ error: "Could not save the post." }, { status: 502 });
  }

  const { data: saved, error: photosError } = await supabase
    .from("photos")
    .insert(photos.map((photo) => ({ ...photo, post_id: post.id })))
    .select("id, path, width, height, position");
  if (photosError) {
    console.error("Garden moments: could not save photos —", photosError.message);
    await supabase.from("posts").delete().eq("id", post.id);
    await discardFiles();
    return NextResponse.json({ error: "Could not save the photos." }, { status: 502 });
  }

  revalidatePath("/garden");
  const ordered = saved
    .sort((a, b) => a.position - b.position)
    .map((photo) => ({ ...photo, url: publicPhotoUrl(supabase, photo.path) }));
  return NextResponse.json({ post: { ...post, photos: ordered } }, { status: 201 });
}

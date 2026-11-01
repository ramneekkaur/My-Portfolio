import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isOwner } from "@/lib/gardenSession";
import { PHOTO_BUCKET, supabaseAdmin } from "@/lib/supabaseServer";

// File types the gallery accepts (the browser converts photos before upload)
const TYPES = { "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png" };
const MAX_BYTES = 8 * 1024 * 1024;

// Returns a short-lived signed URL the owner's browser uploads one photo to,
// straight to storage (so large photos never pass through this server).
export async function POST(request) {
  if (!(await isOwner())) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const supabase = supabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Photo storage is not configured yet." }, { status: 503 });
  }

  let contentType;
  let size;
  try {
    ({ contentType, size } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const extension = TYPES[contentType];
  if (!extension) {
    return NextResponse.json({ error: "Only WebP, JPEG or PNG images can be uploaded." }, { status: 415 });
  }
  if (!Number.isFinite(size) || size <= 0 || size > MAX_BYTES) {
    return NextResponse.json({ error: "Each photo must be under 8 MB." }, { status: 413 });
  }

  const path = `${new Date().getFullYear()}/${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUploadUrl(path);
  if (error) {
    console.error("Garden upload: could not sign upload —", error.message);
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 502 });
  }

  return NextResponse.json({ path: data.path, token: data.token });
}

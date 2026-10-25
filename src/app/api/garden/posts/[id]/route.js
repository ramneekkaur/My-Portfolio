import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isOwner } from "@/lib/gardenSession";
import { readPostFields } from "@/lib/postInput";
import { PHOTO_BUCKET, supabaseAdmin } from "@/lib/supabaseServer";

const ID_PATTERN = /^[0-9a-f-]{36}$/;

async function authorise(params) {
  if (!(await isOwner())) return { error: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  const supabase = supabaseAdmin();
  if (!supabase) {
    return { error: NextResponse.json({ error: "Photo storage is not configured yet." }, { status: 503 }) };
  }
  const { id } = await params;
  if (!ID_PATTERN.test(id)) return { error: NextResponse.json({ error: "Invalid post." }, { status: 400 }) };
  return { supabase, id };
}

// Edit a post's hobby, caption, place or day.
export async function PATCH(request, { params }) {
  const { supabase, id, error } = await authorise(params);
  if (error) return error;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const { fields, error: fieldError } = readPostFields(body);
  if (fieldError) return NextResponse.json({ error: fieldError }, { status: 400 });

  const { data, error: updateError } = await supabase.from("posts").update(fields).eq("id", id).select("id");
  if (updateError) {
    console.error("Garden moments: could not update post —", updateError.message);
    return NextResponse.json({ error: "Could not save the post." }, { status: 502 });
  }
  if (data.length === 0) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  revalidatePath("/garden");
  return NextResponse.json({ ok: true });
}

// Delete a post: its image files, then the post (its photo records go with it).
export async function DELETE(request, { params }) {
  const { supabase, id, error } = await authorise(params);
  if (error) return error;

  const { data: photos, error: findError } = await supabase.from("photos").select("path").eq("post_id", id);
  if (findError) {
    return NextResponse.json({ error: "Post not found." }, { status: 404 });
  }

  if (photos.length > 0) {
    const { error: removeError } = await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path));
    if (removeError) {
      console.error("Garden moments: could not remove files —", removeError.message);
      return NextResponse.json({ error: "Could not delete the photo files." }, { status: 502 });
    }
  }
  const { error: deleteError } = await supabase.from("posts").delete().eq("id", id);
  if (deleteError) {
    console.error("Garden moments: could not delete post —", deleteError.message);
    return NextResponse.json({ error: "Could not delete the post." }, { status: 502 });
  }

  revalidatePath("/garden");
  return NextResponse.json({ ok: true });
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { MAX_CAPTION, MAX_PHOTOS, MAX_PLACE, formatDay } from "@/lib/moments";

const BUCKET = "photos";
const MAX_SIDE = 2400; // photos are shrunk in the browser before upload

// The public (anon) key only lets the browser use the short-lived signed
// upload URLs the server hands out; it grants no other access.
function storageClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
  });
}

// Shrink to MAX_SIDE and re-encode as WebP (JPEG where WebP encoding isn't supported)
async function preparePhoto(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const encode = (type, quality) => new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  let blob = await encode("image/webp", 0.85);
  if (!blob || blob.type !== "image/webp") blob = await encode("image/jpeg", 0.88);
  return { blob, width, height, preview: URL.createObjectURL(blob) };
}

async function postJson(url, body, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

const label = "mb-2 block text-[0.6rem] uppercase tracking-[0.3em] text-gray-400";

// Hobby, caption, place and day: shared by the composer and the editor
function PostFields({ interests, value, onChange, disabled, idPrefix }) {
  const set = (key) => (event) => onChange({ ...value, [key]: event.target.value });
  return (
    <div className="space-y-5">
      <div>
        <label htmlFor={`${idPrefix}-hobby`} className={label}>Hobby</label>
        <select id={`${idPrefix}-hobby`} value={value.interest} onChange={set("interest")} disabled={disabled} className="field-terminal py-2 text-sm">
          {interests.map((interest) => (
            <option key={interest.id} value={interest.id} className="bg-space">
              {interest.title}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-caption`} className={label}>Caption</label>
        <textarea
          id={`${idPrefix}-caption`}
          value={value.caption}
          onChange={set("caption")}
          maxLength={MAX_CAPTION}
          rows={5}
          disabled={disabled}
          placeholder="Write a caption..."
          className="field-terminal resize-y text-sm leading-relaxed"
        />
        <p className="mt-1 text-right text-[0.6rem] tracking-[0.2em] text-gray-500">
          {value.caption.length} / {MAX_CAPTION}
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor={`${idPrefix}-place`} className={label}>Place (optional)</label>
          <input
            id={`${idPrefix}-place`}
            type="text"
            value={value.place}
            onChange={set("place")}
            maxLength={MAX_PLACE}
            disabled={disabled}
            placeholder="e.g. Harz, Germany"
            className="field-terminal py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`${idPrefix}-day`} className={label}>Day (optional)</label>
          <input
            id={`${idPrefix}-day`}
            type="date"
            value={value.takenOn}
            onChange={set("takenOn")}
            disabled={disabled}
            className="field-terminal py-2 text-sm [color-scheme:dark]"
          />
        </div>
      </div>
    </div>
  );
}

const blankPost = (interests) => ({ interest: interests[0].id, caption: "", place: "", takenOn: "" });

// A new post: photos (in order), then hobby, caption, place and day
function Composer({ interests, onShared }) {
  const [items, setItems] = useState([]);
  const [fields, setFields] = useState(() => blankPost(interests));
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const previews = useRef(new Set());

  // Free the local previews when leaving the page
  useEffect(() => {
    const urls = previews.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const update = (key, changes) => setItems((list) => list.map((item) => (item.key === key ? { ...item, ...changes } : item)));
  const move = (index, step) =>
    setItems((list) => {
      const next = [...list];
      [next[index], next[index + step]] = [next[index + step], next[index]];
      return next;
    });

  async function choose(event) {
    const files = [...event.target.files].slice(0, MAX_PHOTOS - items.length);
    event.target.value = "";
    if (files.length === 0) return setStatus(`A post can have up to ${MAX_PHOTOS} photos.`);
    setStatus("");
    for (const file of files) {
      const key = `${file.name}-${file.lastModified}-${Math.random()}`;
      setItems((list) => [...list, { key, name: file.name, status: "preparing" }]);
      try {
        const prepared = await preparePhoto(file);
        previews.current.add(prepared.preview);
        update(key, { ...prepared, status: "ready" });
      } catch {
        update(key, { status: "error" });
        setStatus(`Couldn't read ${file.name} — try a JPEG or PNG.`);
      }
    }
  }

  const ready = items.filter((item) => item.status === "ready");

  async function share() {
    setBusy(true);
    try {
      const storage = storageClient().storage.from(BUCKET);
      const photos = [];
      for (const [i, item] of ready.entries()) {
        setStatus(`Uploading photo ${i + 1} of ${ready.length}...`);
        const { path, token } = await postJson("/api/garden/upload-url", { contentType: item.blob.type, size: item.blob.size });
        const { error } = await storage.uploadToSignedUrl(path, token, item.blob, { contentType: item.blob.type });
        if (error) throw new Error("Upload failed — please try again.");
        photos.push({ path, width: item.width, height: item.height });
      }
      setStatus("Sharing...");
      const { post } = await postJson("/api/garden/posts", { ...fields, photos });
      onShared(post);
      setItems([]);
      setFields(blankPost(interests));
      setStatus("Shared to the Garden World.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel p-6 pt-9 md:p-8 md:pt-10">
      <p className="panel-title">[ New post ]</p>

      <div className="flex flex-wrap items-center gap-4">
        <label className={`btn-terminal btn-terminal-primary cursor-pointer ${items.length >= MAX_PHOTOS || busy ? "pointer-events-none opacity-40" : ""}`}>
          {items.length ? "Add photos" : "Choose photos"}
          <input type="file" accept="image/*" multiple onChange={choose} disabled={busy} className="sr-only" />
        </label>
        <p className="text-xs text-gray-500">
          {items.length} / {MAX_PHOTOS} · resized to {MAX_SIDE}px WebP in your browser
        </p>
      </div>

      {items.length > 0 && (
        <ol className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
          {items.map((item, i) => (
            <li key={item.key} className="relative">
              <div className="aspect-square overflow-hidden rounded-[2px] border border-white/10 bg-white/[0.03]">
                {item.preview && (
                  // Local object-URL preview; next/image can't optimise blob: URLs
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                )}
                {!item.preview && (
                  <p className="p-2 text-[0.55rem] uppercase tracking-[0.2em] text-gray-500">
                    {item.status === "error" ? "Unreadable" : "Preparing..."}
                  </p>
                )}
              </div>
              <span className="absolute left-1 top-1 rounded-[2px] bg-space/80 px-1.5 text-[0.55rem] text-gray-300">{i + 1}</span>
              {!busy && (
                <div className="mt-1 flex justify-between text-xs text-gray-400">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move earlier" className="px-1 hover:text-white disabled:opacity-30">←</button>
                  <button type="button" onClick={() => setItems((list) => list.filter((x) => x.key !== item.key))} aria-label={`Remove ${item.name}`} className="px-1 hover:text-white">✕</button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} aria-label="Move later" className="px-1 hover:text-white disabled:opacity-30">→</button>
                </div>
              )}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-8">
        <PostFields interests={interests} value={fields} onChange={setFields} disabled={busy} idPrefix="new" />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={share}
          disabled={busy || ready.length === 0 || ready.length !== items.length}
          className="btn-terminal btn-terminal-primary disabled:opacity-40"
        >
          {busy ? "Sharing..." : "Share"}
        </button>
        <p aria-live="polite" className="text-[0.65rem] uppercase tracking-[0.2em] text-phosphor">
          {status && <>&gt; {status}</>}
        </p>
      </div>
    </section>
  );
}

// One shared post: edit its hobby, caption, place and day, or delete it
function ManagedPost({ post, interests, onChanged, onDeleted }) {
  const saved = { interest: post.interest, caption: post.caption, place: post.place, takenOn: post.taken_on ?? "" };
  const [fields, setFields] = useState(saved);
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState("");
  const title = interests.find((interest) => interest.id === post.interest)?.title ?? post.interest;

  async function save() {
    setStatus("Saving...");
    try {
      await postJson(`/api/garden/posts/${post.id}`, fields, "PATCH");
      onChanged({ ...post, interest: fields.interest, caption: fields.caption.trim(), place: fields.place.trim(), taken_on: fields.takenOn || null });
      setEditing(false);
      setStatus("Saved");
    } catch (error) {
      setStatus(error.message);
    }
  }

  async function remove() {
    setStatus("Deleting...");
    try {
      await postJson(`/api/garden/posts/${post.id}`, undefined, "DELETE");
      onDeleted(post.id);
    } catch (error) {
      setStatus(error.message);
      setConfirming(false);
    }
  }

  const photo = post.photos[0];
  return (
    <li className="panel p-4">
      <div className="flex gap-4">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[2px] border border-white/10">
          <Image src={photo.url} alt="" fill sizes="96px" className="object-cover" />
          {post.photos.length > 1 && (
            <span className="absolute right-1 top-1 rounded-[2px] bg-space/80 px-1.5 text-[0.55rem] text-gray-200">{post.photos.length}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.6rem] uppercase tracking-[0.3em] text-blossom">❀ {title}</p>
          <p className="mt-1 text-[0.6rem] uppercase tracking-[0.2em] text-gray-500">
            {formatDay(post)}
            {post.place && ` · ${post.place}`}
          </p>
          {!editing && <p className="mt-2 line-clamp-2 text-sm text-gray-300">{post.caption || "No caption"}</p>}
        </div>
      </div>

      {editing && (
        <div className="mt-5">
          <PostFields interests={interests} value={fields} onChange={setFields} idPrefix={post.id} />
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <span className="text-[0.65rem] uppercase tracking-[0.2em] text-white">Delete this post?</span>
            <button type="button" onClick={remove} className="btn-terminal px-3 py-2">Yes</button>
            <button type="button" onClick={() => setConfirming(false)} className="btn-terminal px-3 py-2">No</button>
          </>
        ) : editing ? (
          <>
            <button type="button" onClick={save} className="btn-terminal btn-terminal-primary px-3 py-2">Save</button>
            <button type="button" onClick={() => { setFields(saved); setEditing(false); setStatus(""); }} className="btn-terminal px-3 py-2">Cancel</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setEditing(true)} className="btn-terminal px-3 py-2">Edit</button>
            <button type="button" onClick={() => setConfirming(true)} className="btn-terminal px-3 py-2">Delete</button>
          </>
        )}
        <span aria-live="polite" className="ml-2 text-[0.6rem] uppercase tracking-[0.2em] text-phosphor">{status}</span>
      </div>
    </li>
  );
}

// The owner's page: compose a new post, and manage what's already shared.
export default function Uploader({ interests, initialPosts }) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  async function signOut() {
    await postJson("/api/garden/logout").catch(() => {});
    router.refresh();
  }

  return (
    <div className="mt-12 space-y-14">
      <div>
        <div className="mb-4 flex justify-end">
          <button type="button" onClick={signOut} className="text-[0.65rem] uppercase tracking-[0.25em] text-gray-500 hover:text-white">
            Sign out
          </button>
        </div>
        <Composer interests={interests} onShared={(post) => setPosts((current) => [post, ...current])} />
      </div>

      <section>
        <p className="term-label mb-5">Your posts · {posts.length}</p>
        {posts.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing shared yet.</p>
        ) : (
          <ul className="grid items-start gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <ManagedPost
                key={post.id}
                post={post}
                interests={interests}
                onChanged={(changed) => setPosts((current) => current.map((p) => (p.id === changed.id ? changed : p)))}
                onDeleted={(id) => setPosts((current) => current.filter((p) => p.id !== id))}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

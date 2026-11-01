// Garden World moments: Instagram-style posts, one hobby each, with 1–10
// photos, a caption, an optional place and day. Shared by the server routes,
// the composer and the gallery.

export const MAX_PHOTOS = 10;
export const MAX_CAPTION = 2000;
export const MAX_PLACE = 100;

// Paths produced by /api/garden/upload-url: "<year>/<uuid>.<ext>"
export const PHOTO_PATH = /^\d{4}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;
export const DAY = /^\d{4}-\d{2}-\d{2}$/;

// The day a post belongs to: the day it happened, or else when it was posted
export function postDay(post) {
  return post.taken_on ? new Date(`${post.taken_on}T12:00:00`) : new Date(post.created_at);
}

export function formatDay(post) {
  return postDay(post)
    .toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    .toUpperCase();
}

export function sortPosts(posts) {
  return [...posts].sort((a, b) => postDay(b) - postDay(a) || new Date(b.created_at) - new Date(a.created_at));
}

import "server-only";
import { interests } from "@/data/profile";
import { DAY, MAX_CAPTION, MAX_PHOTOS, MAX_PLACE, PHOTO_PATH } from "./moments";

const HOBBIES = new Set(interests.map((interest) => interest.id));

// Checks a post's text fields. Returns { fields } or { error }.
export function readPostFields(body) {
  const { interest, caption = "", place = "", takenOn = null } = body ?? {};
  if (!HOBBIES.has(interest)) return { error: "Choose one of the hobbies." };
  if (typeof caption !== "string" || caption.length > MAX_CAPTION) {
    return { error: `Captions can be up to ${MAX_CAPTION} characters.` };
  }
  if (typeof place !== "string" || place.length > MAX_PLACE) {
    return { error: `Places can be up to ${MAX_PLACE} characters.` };
  }
  if (takenOn !== null && takenOn !== "" && (typeof takenOn !== "string" || !DAY.test(takenOn) || isNaN(Date.parse(takenOn)))) {
    return { error: "Invalid date." };
  }
  return {
    fields: { interest, caption: caption.trim(), place: place.trim(), taken_on: takenOn || null },
  };
}

// Checks the photos of a new post. Returns { photos } or { error }.
export function readPostPhotos(list) {
  if (!Array.isArray(list) || list.length === 0) return { error: "Add at least one photo." };
  if (list.length > MAX_PHOTOS) return { error: `A post can have up to ${MAX_PHOTOS} photos.` };
  const photos = [];
  for (const [position, photo] of list.entries()) {
    const { path, width, height } = photo ?? {};
    if (typeof path !== "string" || !PHOTO_PATH.test(path)) return { error: "Invalid photo path." };
    if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) {
      return { error: "Invalid photo size." };
    }
    photos.push({ path, width, height, position });
  }
  if (new Set(photos.map((p) => p.path)).size !== photos.length) return { error: "Duplicate photo." };
  return { photos };
}

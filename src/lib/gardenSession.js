import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// The owner's upload session: a signed, expiring token in an httpOnly cookie.
// Only someone who knows GARDEN_UPLOAD_PASSWORD can obtain one.

export const SESSION_COOKIE = "garden_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // seconds

export function authConfigured() {
  return Boolean(process.env.GARDEN_UPLOAD_PASSWORD && process.env.GARDEN_SESSION_SECRET);
}

// Compare digests, so the check takes the same time whatever is typed
export function passwordMatches(input) {
  const expected = process.env.GARDEN_UPLOAD_PASSWORD;
  if (!expected || typeof input !== "string" || input.length === 0) return false;
  const digest = (value) => createHmac("sha256", "garden-password").update(value).digest();
  return timingSafeEqual(digest(input), digest(expected));
}

function sign(payload) {
  return createHmac("sha256", process.env.GARDEN_SESSION_SECRET).update(payload).digest("base64url");
}

export function createSessionToken() {
  const payload = `owner.${Date.now() + SESSION_MAX_AGE * 1000}`;
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token) {
  if (!token || !process.env.GARDEN_SESSION_SECRET) return false;
  const cut = token.lastIndexOf(".");
  if (cut < 0) return false;
  const payload = token.slice(0, cut);
  const signature = Buffer.from(token.slice(cut + 1));
  const expected = Buffer.from(sign(payload));
  if (signature.length !== expected.length || !timingSafeEqual(signature, expected)) return false;
  return Date.now() < Number(payload.split(".")[1]);
}

export async function isOwner() {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  authConfigured,
  createSessionToken,
  passwordMatches,
  sessionCookieOptions,
} from "@/lib/gardenSession";

const FAILURE_DELAY_MS = 600; // slows down password guessing

export async function POST(request) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "Uploads are not configured yet." }, { status: 503 });
  }

  let password = "";
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!passwordMatches(password)) {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS));
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}

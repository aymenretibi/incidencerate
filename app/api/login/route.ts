import { NextResponse } from "next/server";
import { SESSION_COOKIE, checkCredentials, signSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const username = (body.username ?? "").toString();
  const password = (body.password ?? "").toString();

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  const { value, maxAge } = await signSession(username);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: SESSION_COOKIE,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
  return res;
}

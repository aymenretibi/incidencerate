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

  if (!process.env.APP_USERNAME || !process.env.APP_PASSWORD) {
    return NextResponse.json(
      {
        error:
          "server misconfigured: APP_USERNAME / APP_PASSWORD env vars are not set",
      },
      { status: 500 },
    );
  }

  if (!checkCredentials(username, password)) {
    return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
  }

  let value: string;
  let maxAge: number;
  try {
    ({ value, maxAge } = await signSession(username));
  } catch (err) {
    return NextResponse.json(
      {
        error:
          "server misconfigured: " +
          ((err as Error).message ?? "SESSION_SECRET env var missing"),
      },
      { status: 500 },
    );
  }
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

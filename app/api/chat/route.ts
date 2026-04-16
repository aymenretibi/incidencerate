import { NextResponse } from "next/server";
import { z } from "zod";
import { chatIR } from "@/lib/irCalibrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow up to 60s for multi-turn Gemini calls. On Vercel Hobby this caps at
// 60s anyway; on Pro this lifts the default 10s serverless timeout.
export const maxDuration = 60;

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

const BodySchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  overrides: z
    .object({
      age_min: z.number().int().min(0).max(120).nullable().optional(),
      age_max: z.number().int().min(0).max(120).nullable().optional(),
      gender: z.enum(["male", "female", "all"]).optional(),
      seg: z.enum(["ABC1", "ABC1C2", "ABC1C2D", "all"]).optional(),
      geo_type: z.enum(["national", "cities", "regions"]).optional(),
      cities: z.array(z.string()).optional(),
      category: z
        .enum(["financial", "fmcg", "tech", "auto", "healthcare", "other"])
        .optional(),
      recency: z.enum(["P3M", "P6M", "P12M", "ever"]).optional(),
      frequency: z.enum(["heavy", "medium", "light"]).optional(),
      brand_specificity: z
        .enum(["category_only", "specific_brand", "niche_premium"])
        .optional(),
      logic: z.enum(["AND", "OR"]).optional(),
      clinical: z.boolean().optional(),
      extra_notes: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const last = parsed.data.messages[parsed.data.messages.length - 1];
  if (last.role !== "user") {
    return NextResponse.json(
      { error: "last message must be from user" },
      { status: 400 },
    );
  }

  const res = await chatIR({
    messages: parsed.data.messages,
    overrides: parsed.data.overrides,
  });

  if (!res.ok || !res.reply) {
    return NextResponse.json(
      { error: "calibrator_failed", detail: res.error ?? "unknown", raw: res.raw },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, reply: res.reply });
}

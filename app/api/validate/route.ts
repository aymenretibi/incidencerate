import { NextResponse } from "next/server";
import { z } from "zod";
import { calibrateIR } from "@/lib/irCalibrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  cs_description: z.string().min(3),
  market: z.string().min(1),
  assumed_ir: z.number().min(0).max(100),

  // Optional structured overrides — applied only when the user is
  // unhappy with the AI's first answer and nudges specific inputs.
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

  const { cs_description, market, assumed_ir, overrides } = parsed.data;

  const res = await calibrateIR({
    cs_description,
    market,
    assumed_ir,
    overrides,
  });

  if (!res.ok || !res.data) {
    return NextResponse.json(
      { error: "calibrator_failed", detail: res.error ?? "unknown", raw: res.raw },
      { status: 422 },
    );
  }

  return NextResponse.json({ ok: true, result: res.data });
}

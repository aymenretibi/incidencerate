import { NextResponse } from "next/server";
import { z } from "zod";
import { parseScreener } from "@/lib/gemini";
import { calculate } from "@/lib/calculate";
import { SES_PENETRATION } from "@/lib/benchmarks/baseIR";
import type { PanelType, ParsedCriteria } from "@/lib/benchmarks/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  screener: z.string().optional().default(""),
  market: z.string().min(1),
  panel_type: z.enum(["online", "cati", "f2f", "hybrid"]).default("online"),
  assumed_ir: z.number().min(0).max(100).optional(),
  target_n: z.number().int().positive().optional(),

  // Structured intake — authoritative over LLM extraction.
  age_min: z.number().int().min(0).max(120).nullable().optional(),
  age_max: z.number().int().min(0).max(120).nullable().optional(),
  gender: z.enum(["male", "female", "all"]).optional(),
  seg: z.enum(["ABC1", "ABC1C2", "ABC1C2D", "all"]).nullable().optional(),
  category: z
    .enum(["financial", "fmcg", "tech", "auto", "healthcare", "other"])
    .nullable()
    .optional(),
  geo_type: z.enum(["national", "cities", "regions"]).optional(),
  cities: z.array(z.string()).optional(),
  recency: z.enum(["P3M", "P6M", "P12M", "ever"]).nullable().optional(),
  frequency: z.enum(["heavy", "medium", "light"]).nullable().optional(),
  brand_specificity: z
    .enum(["category_only", "specific_brand", "niche_premium"])
    .nullable()
    .optional(),
  logic: z.enum(["AND", "OR"]).optional(),
  clinical: z.boolean().optional(),
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

  const {
    screener,
    market,
    panel_type,
    assumed_ir,
    target_n,
    age_min,
    age_max,
    gender,
    seg,
    category,
    geo_type,
    cities,
    recency,
    frequency,
    brand_specificity,
    logic,
    clinical,
  } = parsed.data;

  if (!SES_PENETRATION[market]) {
    return NextResponse.json(
      { error: `unknown market: ${market}` },
      { status: 400 },
    );
  }

  // Only call the LLM if the user supplied free-text for attitudinal /
  // condition / exclusion extraction. Structured intake fields are
  // authoritative; the LLM is for the soft stuff only.
  const hasScreenerText = screener.trim().length >= 10;

  let llmData: ParsedCriteria | null = null;
  if (hasScreenerText) {
    const llm = await parseScreener(screener, {
      market,
      assumedIR: assumed_ir,
      targetN: target_n,
      panelType: panel_type,
    });
    if (!llm.ok || !llm.data) {
      return NextResponse.json(
        {
          error: "parser_failed",
          detail: llm.error ?? "unknown",
          raw: llm.raw,
        },
        { status: 422 },
      );
    }
    llmData = llm.data as ParsedCriteria;
  }

  const empty: ParsedCriteria = {
    market: null,
    target_n: null,
    assumed_ir: null,
    age_min: null,
    age_max: null,
    gender: "all",
    seg: null,
    category: null,
    geo_restriction: { type: "national" },
    qualifiers: [],
    logic: "AND",
    panel_type: null,
    recency: null,
    frequency: null,
    brand_specificity: null,
    attitudinal: [],
    exclusions: [],
    clinical: false,
    notes: "",
  };

  const llmOrEmpty = llmData ?? empty;

  // Structured intake fields override the LLM. The LLM's contribution
  // is attitudinal / exclusions / qualifiers (condition/ownership/
  // behaviour) and `notes`.
  const geo: ParsedCriteria["geo_restriction"] =
    geo_type === "cities" && cities && cities.length > 0
      ? { type: "cities", cities, count: cities.length }
      : geo_type === "regions"
      ? { type: "regions" }
      : geo_type === "national"
      ? { type: "national" }
      : llmOrEmpty.geo_restriction;

  const criteria: ParsedCriteria = {
    ...llmOrEmpty,
    market,
    panel_type,
    assumed_ir: assumed_ir ?? llmOrEmpty.assumed_ir,
    target_n: target_n ?? llmOrEmpty.target_n,
    age_min: age_min ?? llmOrEmpty.age_min,
    age_max: age_max ?? llmOrEmpty.age_max,
    gender: gender ?? llmOrEmpty.gender,
    seg: seg ?? llmOrEmpty.seg,
    category: category ?? llmOrEmpty.category,
    geo_restriction: geo,
    recency: recency ?? llmOrEmpty.recency,
    frequency: frequency ?? llmOrEmpty.frequency,
    brand_specificity: brand_specificity ?? llmOrEmpty.brand_specificity,
    logic: logic ?? llmOrEmpty.logic,
    clinical: clinical ?? llmOrEmpty.clinical,
  };

  try {
    const result = calculate(criteria, market, panel_type as PanelType);
    return NextResponse.json({ ok: true, criteria, result });
  } catch (err) {
    return NextResponse.json(
      { error: "calc_failed", detail: (err as Error).message },
      { status: 500 },
    );
  }
}

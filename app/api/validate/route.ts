import { NextResponse } from "next/server";
import { z } from "zod";
import { parseScreener } from "@/lib/gemini";
import { calculate } from "@/lib/calculate";
import { BASE_IR } from "@/lib/benchmarks/baseIR";
import type { PanelType, ParsedCriteria } from "@/lib/benchmarks/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  screener: z.string().min(10),
  market: z.string().min(1),
  panel_type: z.enum(["online", "cati", "f2f", "hybrid"]),
  assumed_ir: z.number().min(0).max(100).optional(),
  target_n: z.number().int().positive().optional(),
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

  const { screener, market, panel_type, assumed_ir, target_n } = parsed.data;

  if (!BASE_IR[market]) {
    return NextResponse.json(
      { error: `unknown market: ${market}` },
      { status: 400 },
    );
  }

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

  // UI values override the LLM's extracted fields for market/assumed_ir/panel,
  // since the UI is the source of truth for those.
  const criteria: ParsedCriteria = {
    ...(llm.data as ParsedCriteria),
    market,
    panel_type,
    assumed_ir: assumed_ir ?? llm.data.assumed_ir,
    target_n: target_n ?? llm.data.target_n,
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

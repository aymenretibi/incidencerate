import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { z } from "zod";

/**
 * IR Calibration Quick Validator — Prompt v2.5.1
 * Template Owner: Aymen Retibi – R&G  |  Last Updated: March 2026
 *
 * Embedded verbatim as the system instruction. The LLM is asked for a
 * single JSON object matching the v2.5.1 "Required Output Structure" so
 * the UI can render it in the prescribed format (bold headings, verdict
 * emojis). Temperature is locked to 0 per spec.
 */
const SYSTEM_INSTRUCTION = `IR Calibration Quick Validator
Prompt v2.5.1  |  Template Owner: Aymen Retibi – R&G  |  Last Updated: March 2026

Purpose
Rapidly validate whether an assumed Incidence Rate (IR) for a Custom Sample (CS) is realistic, based on a screener or sample definition. Designed for fast feasibility checks before quoting or launching fieldwork — not full modelling reports.
Commercial risk note: An assumed IR that is too HIGH is the critical error. It means fieldwork will cost more than priced, directly eroding margin. The bot is calibrated to be protective on the high side.

Context & Inputs
You are validating the IR for a Custom Sample derived from a broader Nationally Representative (NR) online panel population.

Required Inputs – YOU MUST ASK USER FOR THESE IF NOT PROVIDED
•\tCustom Sample Description: [CS_DESCRIPTION]
•\tMarket: [MARKET]
•\tAssumed IR: [ASSUMED_IR_PERCENT]

Role
You are a Senior Sample Feasibility & IR Modelling Specialist. You think simultaneously as:
•\tA sample buyer assessing panel feasibility
•\tA fieldwork director planning incidence and cost
•\tA commercial research lead protecting quote accuracy

You must never accept the assumed IR blindly. Your job is to reconstruct it independently and render a verdict.

Output Format
Return a concise validation summary only. Maximum 8 lines. No long explanations. Decision-relevant fields only. Ensure headings e.g. MARKET: are in bold and the predicted IR is also in bold — For the Verdict, if TOO HIGH or TOO LOW use a warning emoji (⛔), ACCURATE use a tick (✅).

Required Output Structure
Market: [MARKET]
Sample Title: [SHORT_SAMPLE_NAME]
Predicted IR: [IR_POINT]%
Predicted IR Range: [IR_LOW]% – [IR_HIGH]%

Verdict: TOO HIGH | TOO LOW | ACCURATE | BORDERLINE
Assumed IR: [ASSUMED_IR_PERCENT]%
Sample Description: [1–2 sentence description of qualifying population]
Short Reason: [1–2 lines]
Assumption Confidence: HIGH | MEDIUM | LOW

Example Output
Market: UK
Sample Title: Premium EV Owners
Predicted IR: 4.8%
Predicted IR Range: 2.5% – 6.5%

Verdict: TOO HIGH
Assumed IR: 12%
Sample Description: Adults who own a premium EV purchased in the last 3 years.
Short Reason: Premium EV ownership + recency filter make 12% unrealistic in a general panel.
Assumption Confidence: MEDIUM (ownership rate assumed, no benchmark available)

IR Modelling Rules (Internal Reasoning — Do Not Print in Output)
The following rules govern your internal reasoning process. Apply them fully before producing the output.

Rule 1 — Screening Layer Identification
Extract all qualification criteria from the screener in routing order:
•\tDemographics (age, gender, geography, socioeconomic tier)
•\tOwnership or product/service holding
•\tCategory usage behaviour
•\tRecency and frequency of use
•\tBrand interaction or awareness
•\tAttitudinal or motivational filters
•\tHard exclusions (conditions, dietary restrictions, competitor employees, etc.)
⚠ Maintain screening order exactly as routed. Earlier filters constrain the base for all subsequent steps.

Rule 2 — Screening Funnel Method
For each criterion: (1) classify restriction level, (2) estimate pass rate, (3) apply sequentially from panel base of 100%.
Restriction levels: Broad (age 18–54, any category buyer P12M), Medium (category buyer P3M, specific SES), Narrow (specific brand owner, heavy user), Very Narrow (diagnosed condition, niche product owner).
Funnel construction example (internal only):
  Panel Base        → 100%
  Age 25–54         → 55% remain   [Broad]
  Category buyer P3M→ 35% remain   [Medium]
  Brand owner       →  8% remain   [Narrow]
  Attitudinal filter→  4% remain   [Narrow]
  Final IR estimate → 0.55 × 0.35 × 0.08 × 0.04 ≈ 0.06%   — multiply sequentially.

Rule 3 — Panel Self-Selection Adjustment
Online panels are not true NR populations. Panel members skew toward engaged, category-aware adults. Apply an upward panel adjustment for behavioural/attitudinal criteria — but not for clinical/epidemiological qualifiers.
  Category usage / brand ownership        → +20–35% vs. true population base
  General behavioural / attitudinal       → +15–25% vs. true population base
  Diagnosed health condition              → No adjustment — use published prevalence
  Geo or SES restriction                  → No adjustment — apply population share directly
⚠ Failure to apply panel adjustment is a primary cause of systematic downward bias in IR estimates.
Language note: express all IR estimates and reasoning in terms of real-world population incidence — never in terms of panel behaviour. The panel adjustment is an internal mechanic only. The Short Reason and Sample Description must describe the qualifying population as it exists in the real world (e.g. "X% of UK adults are estimated to hold this product").

Rule 4 — Conservative Defaults (When Data Unknown)
Use these conservative estimates when no benchmark is available. Always label internally as ASSUMED (CONSERVATIVE).
  Broad demographic filter                 → 35–65%
  Geo / city restriction                   → 10–40%
  Socioeconomic tier (AB)                  → 15–30%  (lower LatAm, higher W. EU)
  Category buyer P12M                      → 30–65%  (apply panel uplift)
  Category buyer P3M                       → 15–50%  (apply panel uplift)
  High-frequency / heavy user              → 5–20%   of prior layer
  Specific brand owner                     → 5–20%   of category buyers
  Niche / premium brand owner              → 1–10%   of category buyers
  Attitudinal / motivational filter        → 20–55%  of prior layer
  Hard exclusion (dietary, medical)        → subtract 5–20% from prior layer
  Diagnosed health condition               → use published prevalence, no panel uplift

Rule 4A — OR Logic Handling
When a screener uses OR logic across multiple qualifying criteria (e.g. 'owns a car OR a motorcycle'), do not sum pass rates. Use the union formula:
  P(pass) = 1 − (1 − p1) × (1 − p2) × … × (1 − pk)
Example: three brand owners each 8% via OR → 1 − (0.92)^3 ≈ 23% (not 24%).
⚠ Always widen the IR range when OR logic is present.

Rule 4B — External Norm Reference (If Uploaded)
If a benchmark sheet is provided, use it as directional reference (category penetration by age/gender, behavioural incidence by market, panel-specific IR benchmarks). Treat benchmarks as directional, never cross-apply across markets without adjusting.

Rule 5 — Market Calibration
  UK / US / Australia                  — large mature panels, use defaults as stated
  Germany / France / Nordics           — medium quality-focused, apply 10–15% downward pressure on behavioural pass rates
  Brazil / Mexico / LatAm              — SES filters more restrictive, geo filters less so
  SEA / APAC                           — variable; widen ranges
  Clinical / Healthcare (any market)   — small specialist panels, anchor to published prevalence

Rule 6 — IR Range Construction
Always produce IR_point (best), IR_low (tightest), IR_high (conservative upper bound). Widen the range when:
  • multiple layers require assumed pass rates
  • niche or rare populations involved
  • OR logic is present
  • no market calibration data
Range width guidance:
  Few layers, good benchmarks       → IR_point ± 30–40%  (3.5 → 2.5–5)
  Several layers, mixed             → IR_point ± 40–60%  (5  → 3–8)
  Many layers / niche population    → IR_point ± 60–80%  (2  → 0.8–3.5)

Rule 7 — Verdict Logic (asymmetric, TOO_HIGH is the critical error)
  Assumed IR  >  IR_high × 1.08       → TOO_HIGH   (quote will underestimate cost; margin at risk)
  IR_high < Assumed IR ≤ IR_high×1.08 → BORDERLINE (flag as risk; recommend IR reduction)
  IR_low × 0.85 ≤ Assumed ≤ IR_high×1.08 → ACCURATE
  Assumed IR  <  IR_low × 0.85        → TOO_LOW    (conservative; safe but may overprice)
⚠ The TOO_HIGH threshold is intentionally tight (1.08×).

Rule 8 — Assumption Confidence Flag
  HIGH   — most/all layers grounded in benchmark data or published prevalence
  MEDIUM — mix of benchmarked and assumed layers
  LOW    — most layers assumed; niche / unusual population
Include a brief parenthetical reason if MEDIUM or LOW.

Quality Control Checklist (run before answering)
  1. All screening layers identified and ordered correctly.
  2. Panel self-selection adjustment applied where relevant.
  3. OR logic handled with union formula (not simple sum).
  4. Market calibration applied.
  5. IR range appropriately wide given assumption uncertainty.
  6. Verdict uses asymmetric thresholds (TOO_HIGH tighter).
  7. Assumption confidence flag assigned.

OUTPUT CONTRACT
Return a SINGLE JSON object, nothing else — no prose, no markdown, no code fences. Keys and types:

{
  "market": string,                          // echo [MARKET]
  "sample_title": string,                    // 2–5 words, e.g. "Premium EV Owners"
  "predicted_ir_point": number,              // percentage 0–100, one decimal
  "predicted_ir_low": number,                // percentage
  "predicted_ir_high": number,               // percentage
  "verdict": "TOO_HIGH" | "TOO_LOW" | "ACCURATE" | "BORDERLINE",
  "assumed_ir": number,                      // echo [ASSUMED_IR_PERCENT]
  "sample_description": string,              // 1–2 sentences, real-world population framing
  "short_reason": string,                    // 1–2 lines
  "assumption_confidence": "HIGH" | "MEDIUM" | "LOW",
  "confidence_reason": string | null         // parenthetical reason, required if MEDIUM/LOW
}

Rules enforced via the JSON contract:
- Percentages are numbers only (no "%" suffix).
- verdict uses underscored enum values (TOO_HIGH, TOO_LOW) — the UI adds the emoji.
- Do not include any field not listed above.
- Never reference panels in any text field (Rule 3 language note).`;

const IR_RESULT_PROPERTIES = {
  market: { type: SchemaType.STRING },
  sample_title: { type: SchemaType.STRING },
  predicted_ir_point: { type: SchemaType.NUMBER },
  predicted_ir_low: { type: SchemaType.NUMBER },
  predicted_ir_high: { type: SchemaType.NUMBER },
  verdict: {
    type: SchemaType.STRING,
    enum: ["TOO_HIGH", "TOO_LOW", "ACCURATE", "BORDERLINE"],
  },
  assumed_ir: { type: SchemaType.NUMBER },
  sample_description: { type: SchemaType.STRING },
  short_reason: { type: SchemaType.STRING },
  assumption_confidence: {
    type: SchemaType.STRING,
    enum: ["HIGH", "MEDIUM", "LOW"],
  },
  confidence_reason: { type: SchemaType.STRING, nullable: true },
};

const IR_RESULT_REQUIRED = [
  "market",
  "sample_title",
  "predicted_ir_point",
  "predicted_ir_low",
  "predicted_ir_high",
  "verdict",
  "assumed_ir",
  "sample_description",
  "short_reason",
  "assumption_confidence",
];

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: IR_RESULT_PROPERTIES,
  required: IR_RESULT_REQUIRED,
};

const CHAT_RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    kind: { type: SchemaType.STRING, enum: ["question", "assessment"] },
    text: { type: SchemaType.STRING, nullable: true },
    assessment: {
      type: SchemaType.OBJECT,
      nullable: true,
      properties: IR_RESULT_PROPERTIES,
    },
  },
  required: ["kind"],
};

const CHAT_ADDENDUM = `

CHATBOT MODE
You are deployed as a conversational validator inside a chat UI. Talk to the user naturally — short, professional, plain English.

The three required inputs (Custom Sample Description, Market, Assumed IR) may arrive gradually across multiple turns. Maintain memory of everything the user has told you so far.

If any of the three inputs is still missing after the latest user message, set "kind": "question" and put a short, specific follow-up in "text" — ask only for what is missing. Do not guess or validate partial input.

As soon as you have all three inputs (anywhere in the conversation), set "kind": "assessment", run the full v2.5.1 calibration internally, and populate the "assessment" object per the base OUTPUT CONTRACT. "text" may hold a brief one-line acknowledgement; the card carries the answer.

On follow-up turns ("what if ages 25–54?", "assume only women"), re-run calibration with the new constraint and return a fresh assessment.

If the user message contains a USER OVERRIDES block, those constraints are authoritative.

CHAT OUTPUT CONTRACT
Return EXACTLY one JSON object. No prose, no markdown, no code fences, no commentary — only JSON.

When asking a follow-up, return this shape (omit "assessment"):
{
  "kind": "question",
  "text": "Which market is this sample for, and what IR did you assume?"
}

When giving a validation, return this shape (include every field of the base IRResult under "assessment"):
{
  "kind": "assessment",
  "text": "Here's the validation:",
  "assessment": {
    "market": "UK",
    "sample_title": "Premium EV Owners",
    "predicted_ir_point": 4.8,
    "predicted_ir_low": 2.5,
    "predicted_ir_high": 6.5,
    "verdict": "TOO_HIGH",
    "assumed_ir": 12,
    "sample_description": "Adults who own a premium EV purchased in the last 3 years.",
    "short_reason": "Premium EV ownership + recency filter make 12% unrealistic in a general population.",
    "assumption_confidence": "MEDIUM",
    "confidence_reason": "ownership rate assumed, no benchmark available"
  }
}

Never mix the two shapes. Never emit the word "null" for the assessment field — simply omit it when kind="question".`;

export const IRResultSchema = z.object({
  market: z.string(),
  sample_title: z.string(),
  predicted_ir_point: z.number().min(0).max(100),
  predicted_ir_low: z.number().min(0).max(100),
  predicted_ir_high: z.number().min(0).max(100),
  verdict: z.enum(["TOO_HIGH", "TOO_LOW", "ACCURATE", "BORDERLINE"]),
  assumed_ir: z.number().min(0).max(100),
  sample_description: z.string(),
  short_reason: z.string(),
  assumption_confidence: z.enum(["HIGH", "MEDIUM", "LOW"]),
  confidence_reason: z.string().nullable().optional(),
});

export type IRResult = z.infer<typeof IRResultSchema>;

export interface CalibratorInput {
  cs_description: string;
  market: string;
  assumed_ir: number;
  /**
   * Optional structured overrides — shown to the LLM as "user override"
   * constraints that it MUST honour in its funnel reconstruction. These
   * come from the UI's "Not happy with the AI? Adjust assumptions" panel.
   */
  overrides?: {
    age_min?: number | null;
    age_max?: number | null;
    gender?: "male" | "female" | "all";
    seg?: "ABC1" | "ABC1C2" | "ABC1C2D" | "all";
    geo_type?: "national" | "cities" | "regions";
    cities?: string[];
    category?:
      | "financial"
      | "fmcg"
      | "tech"
      | "auto"
      | "healthcare"
      | "other";
    recency?: "P3M" | "P6M" | "P12M" | "ever";
    frequency?: "heavy" | "medium" | "light";
    brand_specificity?: "category_only" | "specific_brand" | "niche_premium";
    logic?: "AND" | "OR";
    clinical?: boolean;
    extra_notes?: string;
  };
}

export interface CalibratorResponse {
  ok: boolean;
  data?: IRResult;
  raw?: string;
  error?: string;
}

function overrideBlock(ov: CalibratorInput["overrides"]): string {
  if (!ov) return "";
  const lines: string[] = [];
  const push = (k: string, v: unknown) => {
    if (v === undefined || v === null || v === "") return;
    if (Array.isArray(v) && v.length === 0) return;
    lines.push(`  - ${k}: ${Array.isArray(v) ? v.join(", ") : v}`);
  };
  push("age_min", ov.age_min);
  push("age_max", ov.age_max);
  push("gender", ov.gender);
  push("ses_segment", ov.seg);
  push("geo_type", ov.geo_type);
  push("cities", ov.cities);
  push("category", ov.category);
  push("recency", ov.recency);
  push("frequency", ov.frequency);
  push("brand_specificity", ov.brand_specificity);
  push("logic", ov.logic);
  push("clinical", ov.clinical);
  push("extra_notes", ov.extra_notes);
  if (lines.length === 0) return "";
  return `\n\nUSER OVERRIDES (treat these as authoritative constraints on your funnel — the user has explicitly pinned these values; honour them when reconstructing IR):\n${lines.join("\n")}`;
}

export async function calibrateIR(
  input: CalibratorInput,
): Promise<CalibratorResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const client = new GoogleGenerativeAI(apiKey);

  const userMessage = `Custom Sample Description: ${input.cs_description.trim()}
Market: ${input.market}
Assumed IR: ${input.assumed_ir}%${overrideBlock(input.overrides)}

Produce the JSON object per the OUTPUT CONTRACT. Temperature is 0; be deterministic.`;

  async function callModel(useResponseSchema: boolean): Promise<string> {
    const model = client.getGenerativeModel({
      model: modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
        ...(useResponseSchema
          ? { responseSchema: RESPONSE_SCHEMA as unknown as object }
          : {}),
      },
    });
    const result = await model.generateContent(userMessage);
    return result.response.text();
  }

  let raw = "";
  try {
    raw = await callModel(true);
  } catch {
    try {
      raw = await callModel(false);
    } catch (err2) {
      return { ok: false, error: (err2 as Error).message };
    }
  }

  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { ok: false, raw, error: "LLM returned non-JSON" };
  }

  const validated = IRResultSchema.safeParse(parsed);
  if (!validated.success) {
    return { ok: false, raw, error: validated.error.message };
  }
  return { ok: true, data: validated.data };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Chat mode — the primary path the UI uses.
 * The LLM owns memory across turns, asks follow-ups when inputs are missing,
 * and returns a discriminated { kind: "question" | "assessment" } payload.
 * ──────────────────────────────────────────────────────────────────────────── */

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export const ChatReplySchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("question"),
    text: z.string().min(1),
    assessment: z.null().optional(),
  }),
  z.object({
    kind: z.literal("assessment"),
    text: z.string().nullable().optional(),
    assessment: IRResultSchema,
  }),
]);

export type ChatReply = z.infer<typeof ChatReplySchema>;

export interface ChatInput {
  messages: ChatTurn[];
  overrides?: CalibratorInput["overrides"];
}

export interface ChatResponse {
  ok: boolean;
  reply?: ChatReply;
  raw?: string;
  error?: string;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

// Pull the first balanced JSON object out of a string, even if the model
// added stray prose, XML-ish tags, or code fences around it.
function extractJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export async function chatIR(input: ChatInput): Promise<ChatResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };
  if (input.messages.length === 0) {
    return { ok: false, error: "no messages provided" };
  }

  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const client = new GoogleGenerativeAI(apiKey);

  const history = input.messages.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
  const latest = input.messages[input.messages.length - 1];
  if (latest.role !== "user") {
    return { ok: false, error: "last message must be from user" };
  }

  const ov = overrideBlock(input.overrides);
  const latestMessage = ov ? `${latest.content}${ov}` : latest.content;

  const started = Date.now();

  // responseSchema with a nullable nested OBJECT is unreliable across Gemini
  // model families (and unsupported on Gemma). Rely on the prompt-level JSON
  // contract + responseMimeType and post-process defensively.
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION + CHAT_ADDENDUM,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
    },
  });

  let raw = "";
  try {
    const chat = model.startChat({ history });
    const result = await withTimeout(
      chat.sendMessage(latestMessage),
      50_000,
      `Gemini (${modelName})`,
    );
    raw = result.response.text() ?? "";
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[chatIR] model call failed", {
      model: modelName,
      ms: Date.now() - started,
      err: msg,
    });
    return { ok: false, error: msg };
  }

  if (!raw || raw.trim().length === 0) {
    console.error("[chatIR] empty response from model", { model: modelName });
    return { ok: false, error: "empty response from model" };
  }

  const candidate =
    extractJsonObject(raw) ??
    raw
      .trim()
      .replace(/^```(?:json)?/i, "")
      .replace(/```$/, "")
      .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(candidate);
  } catch {
    console.error("[chatIR] non-JSON response", {
      model: modelName,
      preview: raw.slice(0, 400),
    });
    return { ok: false, raw, error: "LLM returned non-JSON" };
  }

  // Normalise a few common shape-drift cases the model may produce.
  if (parsed && typeof parsed === "object") {
    const p = parsed as Record<string, unknown>;
    if (p.kind === "question") {
      delete p.assessment;
    }
    if (p.kind === "assessment" && typeof p.text !== "string") {
      p.text = null;
    }
  }

  const validated = ChatReplySchema.safeParse(parsed);
  if (!validated.success) {
    console.error("[chatIR] schema validation failed", {
      model: modelName,
      zod: validated.error.message,
      preview: raw.slice(0, 400),
    });
    return { ok: false, raw, error: validated.error.message };
  }

  console.info("[chatIR] ok", {
    model: modelName,
    ms: Date.now() - started,
    kind: validated.data.kind,
  });
  return { ok: true, reply: validated.data };
}

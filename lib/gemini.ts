import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ParsedCriteriaSchema, type ParsedCriteriaT } from "./schemas";

const SYSTEM_INSTRUCTION = `You are a strict screener parser. Your ONLY job is to
read the raw screener text and return a single JSON object describing the
target sample.

You MUST NOT estimate, predict, or reason about incidence rate.
You MUST NOT invent criteria that are not present in the text.
Your output will be fed directly into a deterministic IR calculator — do not
include any prose, markdown or code fences.

Output must exactly match this shape (keys, types, nullability):

{
  "market": string | null,
  "target_n": integer | null,
  "assumed_ir": number 0-100 | null,

  "age_min": integer | null,
  "age_max": integer | null,
  "gender": "male" | "female" | "all",
  "seg": "ABC1" | "ABC1C2" | "ABC1C2D" | "all" | null,

  "category": "financial" | "fmcg" | "tech" | "auto" | "healthcare" | "other" | null,
  "geo_restriction": {
    "type": "national" | "cities" | "regions",
    "cities": string[] | undefined,
    "count": integer | undefined
  },
  "qualifiers": [
    { "kind": "condition" | "ownership" | "behaviour" | "other", "value": string }
  ],
  "logic": "AND" | "OR",
  "panel_type": "online" | "cati" | "f2f" | "hybrid" | null,

  "recency": "P3M" | "P6M" | "P12M" | "ever" | null,
  "frequency": "heavy" | "medium" | "light" | null,
  "brand_specificity": "category_only" | "specific_brand" | "niche_premium" | null,
  "attitudinal": string[],
  "exclusions": string[],
  "clinical": boolean,

  "notes": string
}

Field rules:
- "logic" = "OR" if ANY block of criteria in the screener uses OR ("either A or B",
  "owns X or Y"). Otherwise "AND".
- "category" = "healthcare" whenever the screener is medical/clinical/patient.
- "clinical" = true whenever the screener filters by a diagnosed medical condition,
  treatment, or uses patient-recruitment language (e.g. "diagnosed with…",
  "on medication for…"). Note: this is separate from category="healthcare",
  which may still apply without being clinical (e.g. OTC buyers).
- "recency" = the tightest purchase/usage window mentioned. "last 3 months"→P3M,
  "last 6 months"→P6M, "last year"→P12M, "ever / at some point"→ever.
- "frequency":
    heavy  = uses daily / multiple times a week / >X per week
    medium = uses weekly / a few times a month
    light  = uses occasionally / less than monthly
  Only set if the screener mentions frequency at all.
- "brand_specificity":
    category_only  = "buys shampoo", "owns a car" — no brand named
    specific_brand = a named brand (Nike, Ford) or one brand only
    niche_premium  = premium / luxury / low-share brand (Bentley, Tesla, La Mer)
- "attitudinal" = array of motivational / attitudinal / claimed-belief filters
  that are not demographic, ownership or behavioural (e.g. "believes in
  sustainability", "seeks value over brand", "price-sensitive").
- "exclusions" = array of HARD exclusion phrases (e.g. "works in market research",
  "dietary: vegan", "no competitor employees", "excludes past 6 months").
- "qualifiers" now covers core ownership / behaviour / condition ONLY — do not
  duplicate attitudinal or exclusion items there.
- If the screener covers the full country, geo_restriction.type = "national".
- "notes" is a single plain sentence flagging anything ambiguous you couldn't
  fit into the schema. Empty string if nothing is ambiguous.

Here are 5 reference examples. Study them.

--- Example 1: OR-logic ownership ---
SCREENER: "Brazil, n=300, assumed IR 40%. Adults 25–54, ABC1C2, who either own
a premium credit card OR have invested in mutual funds in the last 12 months.
Nationwide. Online panel."
OUTPUT:
{"market":"Brazil","target_n":300,"assumed_ir":40,"age_min":25,"age_max":54,"gender":"all","seg":"ABC1C2","category":"financial","geo_restriction":{"type":"national"},"qualifiers":[{"kind":"ownership","value":"owns a premium credit card"},{"kind":"behaviour","value":"invested in mutual funds in last 12 months"}],"logic":"OR","panel_type":"online","recency":"P12M","frequency":null,"brand_specificity":"niche_premium","attitudinal":[],"exclusions":[],"clinical":false,"notes":"OR-logic between ownership and behaviour."}

--- Example 2: 3-city geo + heavy frequency ---
SCREENER: "Mexico, n=200, assumed IR 30%. Women 18–45, ABC1, who buy skincare
at least weekly. Only Mexico City, Guadalajara, Monterrey. Online."
OUTPUT:
{"market":"Mexico","target_n":200,"assumed_ir":30,"age_min":18,"age_max":45,"gender":"female","seg":"ABC1","category":"fmcg","geo_restriction":{"type":"cities","cities":["Mexico City","Guadalajara","Monterrey"],"count":3},"qualifiers":[{"kind":"behaviour","value":"buys skincare weekly"}],"logic":"AND","panel_type":"online","recency":"P3M","frequency":"heavy","brand_specificity":"category_only","attitudinal":[],"exclusions":[],"clinical":false,"notes":"Weekly purchase treated as P3M recency + heavy frequency."}

--- Example 3: medical condition + exclusion ---
SCREENER: "Germany, n=120, assumed IR 12%. Adults diagnosed with Type 2
Diabetes by a physician in the last 5 years, currently on oral medication.
Exclude anyone who works in pharma or market research. Nationwide. Online panel."
OUTPUT:
{"market":"Germany","target_n":120,"assumed_ir":12,"age_min":null,"age_max":null,"gender":"all","seg":null,"category":"healthcare","geo_restriction":{"type":"national"},"qualifiers":[{"kind":"condition","value":"Type 2 Diabetes diagnosed in last 5 years"},{"kind":"behaviour","value":"on oral medication"}],"logic":"AND","panel_type":"online","recency":null,"frequency":null,"brand_specificity":null,"attitudinal":[],"exclusions":["works in pharma","works in market research"],"clinical":true,"notes":""}

--- Example 4: ABC1C2 + age + attitudinal ---
SCREENER: "Spain, n=400, assumed IR 55%. Men 25–54, ABC1C2, working full-time,
who consider themselves early adopters of new technology. National. CATI."
OUTPUT:
{"market":"Spain","target_n":400,"assumed_ir":55,"age_min":25,"age_max":54,"gender":"male","seg":"ABC1C2","category":"tech","geo_restriction":{"type":"national"},"qualifiers":[{"kind":"other","value":"working full-time"}],"logic":"AND","panel_type":"cati","recency":null,"frequency":null,"brand_specificity":null,"attitudinal":["considers themselves early tech adopter"],"exclusions":[],"clinical":false,"notes":""}

--- Example 5: niche premium ownership ---
SCREENER: "UK, n=150, assumed IR 8%. Adults 30+, own a pure-electric vehicle
(not hybrid), purchased within the last 24 months. National. Online."
OUTPUT:
{"market":"UK","target_n":150,"assumed_ir":8,"age_min":30,"age_max":null,"gender":"all","seg":null,"category":"auto","geo_restriction":{"type":"national"},"qualifiers":[{"kind":"ownership","value":"owns pure-electric vehicle (not hybrid)"},{"kind":"behaviour","value":"purchased EV in last 24 months"}],"logic":"AND","panel_type":"online","recency":"P12M","frequency":null,"brand_specificity":"niche_premium","attitudinal":[],"exclusions":[],"clinical":false,"notes":"24m recency rounded to P12M (tightest supported window)."}

Now parse the following screener. Return ONLY the JSON object — no prose, no code fences.`;

const RESPONSE_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    market: { type: SchemaType.STRING, nullable: true },
    target_n: { type: SchemaType.INTEGER, nullable: true },
    assumed_ir: { type: SchemaType.NUMBER, nullable: true },
    age_min: { type: SchemaType.INTEGER, nullable: true },
    age_max: { type: SchemaType.INTEGER, nullable: true },
    gender: { type: SchemaType.STRING, enum: ["male", "female", "all"] },
    seg: {
      type: SchemaType.STRING,
      enum: ["ABC1", "ABC1C2", "ABC1C2D", "all"],
      nullable: true,
    },
    category: {
      type: SchemaType.STRING,
      enum: ["financial", "fmcg", "tech", "auto", "healthcare", "other"],
      nullable: true,
    },
    geo_restriction: {
      type: SchemaType.OBJECT,
      properties: {
        type: {
          type: SchemaType.STRING,
          enum: ["national", "cities", "regions"],
        },
        cities: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        count: { type: SchemaType.INTEGER },
      },
      required: ["type"],
    },
    qualifiers: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          kind: {
            type: SchemaType.STRING,
            enum: ["condition", "ownership", "behaviour", "other"],
          },
          value: { type: SchemaType.STRING },
        },
        required: ["kind", "value"],
      },
    },
    logic: { type: SchemaType.STRING, enum: ["AND", "OR"] },
    panel_type: {
      type: SchemaType.STRING,
      enum: ["online", "cati", "f2f", "hybrid"],
      nullable: true,
    },
    recency: {
      type: SchemaType.STRING,
      enum: ["P3M", "P6M", "P12M", "ever"],
      nullable: true,
    },
    frequency: {
      type: SchemaType.STRING,
      enum: ["heavy", "medium", "light"],
      nullable: true,
    },
    brand_specificity: {
      type: SchemaType.STRING,
      enum: ["category_only", "specific_brand", "niche_premium"],
      nullable: true,
    },
    attitudinal: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    exclusions: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    clinical: { type: SchemaType.BOOLEAN },
    notes: { type: SchemaType.STRING },
  },
  required: [
    "market",
    "target_n",
    "assumed_ir",
    "age_min",
    "age_max",
    "gender",
    "seg",
    "category",
    "geo_restriction",
    "qualifiers",
    "logic",
    "panel_type",
    "recency",
    "frequency",
    "brand_specificity",
    "attitudinal",
    "exclusions",
    "clinical",
    "notes",
  ],
};

export interface ParseResult {
  ok: boolean;
  data?: ParsedCriteriaT;
  raw?: string;
  error?: string;
}

export async function parseScreener(
  screenerText: string,
  hints?: { market?: string; assumedIR?: number; targetN?: number; panelType?: string },
): Promise<ParseResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { ok: false, error: "GEMINI_API_KEY not set" };

  const modelName = process.env.GEMINI_MODEL || "gemma-4-26b-a4b-it";
  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    systemInstruction: SYSTEM_INSTRUCTION,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      // responseSchema is best-effort; some Gemma models don't support it, so
      // we also validate with Zod below.
      responseSchema: RESPONSE_SCHEMA as any,
    },
  });

  const hintLine = hints
    ? `\n(UI hints — only use these to disambiguate, do NOT override screener text: market=${hints.market ?? "-"}, assumed_ir=${hints.assumedIR ?? "-"}, target_n=${hints.targetN ?? "-"}, panel_type=${hints.panelType ?? "-"})`
    : "";

  let raw = "";
  try {
    const result = await model.generateContent(
      `SCREENER:\n${screenerText.trim()}${hintLine}`,
    );
    raw = result.response.text();
  } catch (err) {
    // Retry once without responseSchema for models that reject it.
    try {
      const fallback = client.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_INSTRUCTION,
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
        },
      });
      const result = await fallback.generateContent(
        `SCREENER:\n${screenerText.trim()}${hintLine}`,
      );
      raw = result.response.text();
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

  const validated = ParsedCriteriaSchema.safeParse(parsed);
  if (!validated.success) {
    return { ok: false, raw, error: validated.error.message };
  }
  return { ok: true, data: validated.data };
}

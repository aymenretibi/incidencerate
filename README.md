# IR Validator

A deterministic incidence-rate (IR) feasibility check driven by the **IR
Modelling Rules** ruleset (internal). The LLM only parses screener text into
a structured criteria object — every number comes from a sequential screening
funnel evaluated against hardcoded benchmark tables.

## Rules engine

The calculator implements all eight rules from the spec:

| Rule | Covered in | Summary |
|------|------------|---------|
| **1. Screening layer identification** | `lib/gemini.ts` | LLM extracts ordered qualification criteria (demographics, ownership, behaviour, recency, brand, attitudinal, exclusions). |
| **2. Sequential funnel** | `lib/calculate.ts` | Every filter applied in routing order from a 100% panel base, classified Broad / Medium / Narrow / Very Narrow. |
| **3. Panel uplift (selective)** | `lib/benchmarks/panelUplift.ts` | +20–35% for category/brand, +15–25% for attitudinal. NO uplift for clinical / geo / SES. Attenuated for CATI / F2F. |
| **4. Conservative defaults** | `lib/benchmarks/funnelDefaults.ts` | All Rule-4 pass-rate ranges encoded as constants, labelled `source: "assumed"` when used. |
| **4A. OR-logic union** | `lib/calculate.ts#unionRanges` | Qualifier layers combined via `1 − Π(1−pᵢ)`, with extra widening. |
| **5. Market calibration** | `lib/benchmarks/marketCalibration.ts` | 5 groups (`anglo_mature`, `quality_eu`, `latam`, `apac_mea`, `cee_other`) each carrying behavioural / SES / geo / range adjustments. |
| **6. IR range** | `lib/calculate.ts` | Produces `IR_low / IR_point / IR_high`; widens on assumptions, OR logic, VeryNarrow layers, unknown market. |
| **7. Verdict thresholds** | `lib/calculate.ts` | `TOO_HIGH` (> high × 1.08), `BORDERLINE` (> high), `ACCURATE`, `TOO_LOW` (< low × 0.85). |
| **8. Confidence flag** | `lib/calculate.ts` | `HIGH` / `MEDIUM` / `LOW` based on benchmark-vs-assumed layer mix, with a parenthetical reason. |

Real-world framing (Rule 3 language note) — the output `short_reason` always
describes the qualifying **population**, never the panel.

## Architecture

```
User → UI (React) ─POST /api/validate─► Parser (Gemini, temp=0, few-shot)
                                            │
                                            ▼  Zod-validated ParsedCriteria
                                       Calculator (sequential funnel)
                                            │   ├─ SES_PENETRATION
                                            │   ├─ AGE/GEO/GENDER defaults
                                            │   ├─ Category/Brand/Attitudinal
                                            │   ├─ Condition prevalence
                                            │   ├─ Exclusions
                                            │   ├─ Market calibration
                                            │   └─ Panel uplift (selective)
                                            ▼
                                    { verdict, confidence,
                                      ir_low, ir_point, ir_high,
                                      layers, short_reason }
```

## Setup

```sh
cp .env.local.example .env.local   # fill in values
npm install
npm run dev                         # http://localhost:3000
```

### Required env vars

| Name | Purpose |
|------|---------|
| `APP_USERNAME` | Login username |
| `APP_PASSWORD` | Login password |
| `SESSION_SECRET` | HMAC key for signed session cookie. ≥ 16 chars. |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Model name (default `gemma-4-26b-a4b-it`) |

## Replacing the placeholder benchmarks

All benchmark numbers are **industry-informed prototype estimates** — drop
in validated data by editing:

- `lib/benchmarks/baseIR.ts` — SES penetration per market × tier, as
  `{low, point, high}` decimal fractions.
- `lib/benchmarks/funnelDefaults.ts` — Rule 4 default ranges for each layer
  type (age, geo, category, brand, attitudinal, conditions, income).
- `lib/benchmarks/marketCalibration.ts` — Rule 5 group adjustments.
- `lib/benchmarks/panelUplift.ts` — Rule 3 uplift ranges.

Types and shapes are fixed in `lib/benchmarks/types.ts`; only the values
need to change.

## Safety / determinism notes

- **Temperature is locked to 0** in `lib/gemini.ts`. LLM output is Zod-validated.
- **UI inputs override** the LLM's market / assumed_ir / target_n / panel_type.
- **Gemini API key** stays server-side; middleware + API routes only.
- **No panel references** in user-facing output (Rule 3 language note).

# IR Validator

A three-layer tool for fast incidence-rate (IR) feasibility checks on custom
samples. The LLM **never decides** the IR — it only parses the screener into a
structured criteria object. All numerical output comes from deterministic
computation against hardcoded benchmark tables.

## Architecture

| Layer | Responsibility | Lives in |
|-------|----------------|----------|
| **1 — Parser** | Gemini call, temperature 0, few-shot prompt, Zod-validated JSON | `lib/gemini.ts`, `lib/schemas.ts` |
| **2 — Benchmarks** | Hardcoded `BASE_IR × MODIFIERS × PANEL_UPLIFT` constants | `lib/benchmarks/*.ts` |
| **3 — Calculator** | Pure math → verdict (`ACCEPT` / `REVIEW` / `REJECT`) + confidence + risk flag | `lib/calculate.ts` |

The UI (`app/page.tsx` + `components/`) pastes screener text, posts to
`/api/validate`, and renders a verdict card plus criteria breakdown.

```
final_IR = base_IR × Π(modifiers) × panel_uplift
floor_IR = base_IR_floor × Π(modifiers_min) × panel_uplift
verdict  = ACCEPT / REVIEW / REJECT
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
| `APP_USERNAME` | Login username (`System1`) |
| `APP_PASSWORD` | Login password (`TestingAI`) |
| `SESSION_SECRET` | HMAC key for signed session cookie. ≥ 16 chars random. |
| `GEMINI_API_KEY` | Google AI Studio API key |
| `GEMINI_MODEL` | Model name (default `gemma-4-26b-a4b-it`) |

## Replacing the placeholder benchmarks

All benchmark numbers are **placeholders** until the validated dataset is pasted
in. The three files to edit are:

- `lib/benchmarks/baseIR.ts` — `Record<Market, Record<Segment, {point, floor}>>`.
  42 markets × 6 segments (general_population, abc1, abc1c2, abc1c2d,
  women_18_45, men_25_54, adults_18_34). Percentages (0–100).
- `lib/benchmarks/modifiers.ts` — multiplier ranges per qualifier type
  (category, geo, age, gender, condition, income). `{ min, max }`.
- `lib/benchmarks/panelUplift.ts` — `PanelType → ProjectType → multiplier`.

Types and shape are fixed in `lib/benchmarks/types.ts`; only the values
inside each file need to change.

## Deploying to Vercel

1. Push this repo to GitHub.
2. In Vercel, "Import Project" → select the repo.
3. Framework: **Next.js** (auto-detected).
4. Add the 5 env vars above under Project → Settings → Environment Variables.
5. Deploy. The login page gates every route via `proxy.ts` (Next.js 16 proxy/middleware).

## Verification

- `/` redirects to `/login` when no session cookie is present.
- Login with `System1` / `TestingAI` → calculator renders.
- Paste a screener → `/api/validate` → `VerdictCard` + `CriteriaBreakdown`.
- Malformed screener → parser-failure card with raw LLM output visible.
- `POST /api/logout` clears the cookie.

## Safety / determinism notes

- **Temperature is locked to 0** in `lib/gemini.ts`.
- **UI inputs override** the LLM's market / assumed_ir / target_n / panel_type
  (see `app/api/validate/route.ts`). The LLM's extraction of those fields is
  only used as fallback.
- **Zod schema enforcement** in `lib/schemas.ts` — malformed LLM output
  returns a 422, not a garbage calculation.
- **Gemini API key** stays server-side; middleware + API routes only.

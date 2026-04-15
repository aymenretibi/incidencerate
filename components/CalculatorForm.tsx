"use client";

import { useState, type FormEvent } from "react";
import { IRResultCard } from "./IRResultCard";
import type { IRResult } from "@/lib/irCalibrator";

interface Props {
  markets: string[];
}

interface ValidateResponse {
  ok: true;
  result: IRResult;
}
interface ValidateError {
  ok?: false;
  error: string;
  detail?: string;
  raw?: string;
  details?: unknown;
}

type Gender = "male" | "female" | "all" | "";
type Seg = "ABC1" | "ABC1C2" | "ABC1C2D" | "all" | "";
type Category =
  | "financial"
  | "fmcg"
  | "tech"
  | "auto"
  | "healthcare"
  | "other"
  | "";
type GeoType = "national" | "cities" | "regions" | "";
type Recency = "P3M" | "P6M" | "P12M" | "ever" | "";
type Frequency = "heavy" | "medium" | "light" | "";
type BrandSpec = "category_only" | "specific_brand" | "niche_premium" | "";
type Logic = "AND" | "OR" | "";

interface Overrides {
  age_min?: number | null;
  age_max?: number | null;
  gender?: Exclude<Gender, "">;
  seg?: Exclude<Seg, "">;
  geo_type?: Exclude<GeoType, "">;
  cities?: string[];
  category?: Exclude<Category, "">;
  recency?: Exclude<Recency, "">;
  frequency?: Exclude<Frequency, "">;
  brand_specificity?: Exclude<BrandSpec, "">;
  logic?: Exclude<Logic, "">;
  clinical?: boolean;
  extra_notes?: string;
}

export function CalculatorForm({ markets }: Props) {
  // Primary inputs — the three the v2.5.1 prompt requires.
  const [csDescription, setCsDescription] = useState("");
  const [market, setMarket] = useState(markets[0] ?? "");
  const [assumedIR, setAssumedIR] = useState<string>("");

  // Overrides — shown as a disclosure ONLY after the first AI answer.
  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [gender, setGender] = useState<Gender>("");
  const [seg, setSeg] = useState<Seg>("");
  const [category, setCategory] = useState<Category>("");
  const [geoType, setGeoType] = useState<GeoType>("");
  const [citiesStr, setCitiesStr] = useState<string>("");
  const [recency, setRecency] = useState<Recency>("");
  const [frequency, setFrequency] = useState<Frequency>("");
  const [brandSpec, setBrandSpec] = useState<BrandSpec>("");
  const [logic, setLogic] = useState<Logic>("");
  const [clinical, setClinical] = useState(false);
  const [extraNotes, setExtraNotes] = useState("");
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<ValidateError | null>(null);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function buildOverrides(): Overrides | undefined {
    const o: Overrides = {};
    if (ageMin) o.age_min = Number(ageMin);
    if (ageMax) o.age_max = Number(ageMax);
    if (gender) o.gender = gender;
    if (seg) o.seg = seg;
    if (geoType) o.geo_type = geoType;
    if (geoType === "cities" && citiesStr) {
      o.cities = citiesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }
    if (category) o.category = category;
    if (recency) o.recency = recency;
    if (frequency) o.frequency = frequency;
    if (brandSpec) o.brand_specificity = brandSpec;
    if (logic) o.logic = logic;
    if (clinical) o.clinical = true;
    if (extraNotes.trim()) o.extra_notes = extraNotes.trim();
    return Object.keys(o).length === 0 ? undefined : o;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setResponse(null);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        cs_description: csDescription,
        market,
        assumed_ir: Number(assumedIR),
      };
      const ov = buildOverrides();
      if (ov) body.overrides = ov;

      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ValidateResponse | ValidateError;
      if (!res.ok || !("ok" in data && data.ok)) {
        setError(data as ValidateError);
        return;
      }
      setResponse(data as ValidateResponse);
    } catch (err) {
      setError({ error: "network_error", detail: (err as Error).message });
    } finally {
      setPending(false);
    }
  }

  const hasAnswered = !!response;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">IR Calibration Quick Validator</h1>
          <p className="text-sm text-white/60">
            Answer three questions — the AI reconstructs the IR independently
            (prompt v2.5.1, temperature 0).
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-white/60 underline hover:text-white"
        >
          Logout
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        {/* Left — primary inputs */}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <Field label="Custom Sample Description">
            <textarea
              value={csDescription}
              onChange={(e) => setCsDescription(e.target.value)}
              rows={8}
              placeholder={`e.g. "Adults who own a premium EV purchased in the last 3 years."`}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Market">
              <input
                list="markets"
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                placeholder="e.g. UK"
                className={inputCls}
                required
              />
              <datalist id="markets">
                {markets.map((m) => (
                  <option key={m} value={m} />
                ))}
              </datalist>
            </Field>

            <Field label="Assumed IR (%)">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={assumedIR}
                onChange={(e) => setAssumedIR(e.target.value)}
                placeholder="e.g. 12"
                className={inputCls}
                required
              />
            </Field>
          </div>

          {/* Adjust assumptions — shown only after the first AI answer,
              per "only have the tab selects if unhappy with the AI". */}
          {hasAnswered && (
            <details
              open={adjustOpen}
              onToggle={(e) =>
                setAdjustOpen((e.target as HTMLDetailsElement).open)
              }
              className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm"
            >
              <summary className="cursor-pointer select-none text-white/80">
                Not happy with the AI&apos;s answer? Adjust assumptions and
                re-validate
              </summary>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age min">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageMin}
                      onChange={(e) => setAgeMin(e.target.value)}
                      placeholder="—"
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Age max">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={ageMax}
                      onChange={(e) => setAgeMax(e.target.value)}
                      placeholder="—"
                      className={inputCls}
                    />
                  </Field>

                  <Field label="Gender">
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="all">all</option>
                      <option value="female">female</option>
                      <option value="male">male</option>
                    </select>
                  </Field>

                  <Field label="SES segment">
                    <select
                      value={seg}
                      onChange={(e) => setSeg(e.target.value as Seg)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="ABC1">ABC1</option>
                      <option value="ABC1C2">ABC1C2</option>
                      <option value="ABC1C2D">ABC1C2D</option>
                      <option value="all">all</option>
                    </select>
                  </Field>

                  <Field label="Geo coverage">
                    <select
                      value={geoType}
                      onChange={(e) => setGeoType(e.target.value as GeoType)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="national">national</option>
                      <option value="cities">specific cities</option>
                      <option value="regions">regions</option>
                    </select>
                  </Field>

                  {geoType === "cities" && (
                    <Field label="Cities">
                      <input
                        type="text"
                        value={citiesStr}
                        onChange={(e) => setCitiesStr(e.target.value)}
                        placeholder="comma-separated"
                        className={inputCls}
                      />
                    </Field>
                  )}

                  <Field label="Category">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="financial">financial</option>
                      <option value="fmcg">fmcg</option>
                      <option value="tech">tech</option>
                      <option value="auto">auto</option>
                      <option value="healthcare">healthcare</option>
                      <option value="other">other</option>
                    </select>
                  </Field>

                  <Field label="Recency">
                    <select
                      value={recency}
                      onChange={(e) => setRecency(e.target.value as Recency)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="P3M">past 3 months</option>
                      <option value="P6M">past 6 months</option>
                      <option value="P12M">past 12 months</option>
                      <option value="ever">ever</option>
                    </select>
                  </Field>

                  <Field label="Frequency">
                    <select
                      value={frequency}
                      onChange={(e) =>
                        setFrequency(e.target.value as Frequency)
                      }
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="heavy">heavy</option>
                      <option value="medium">medium</option>
                      <option value="light">light</option>
                    </select>
                  </Field>

                  <Field label="Brand specificity">
                    <select
                      value={brandSpec}
                      onChange={(e) =>
                        setBrandSpec(e.target.value as BrandSpec)
                      }
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="category_only">any brand in category</option>
                      <option value="specific_brand">specific brand</option>
                      <option value="niche_premium">premium / niche</option>
                    </select>
                  </Field>

                  <Field label="Logic between qualifiers">
                    <select
                      value={logic}
                      onChange={(e) => setLogic(e.target.value as Logic)}
                      className={inputCls}
                    >
                      <option value="">let AI decide</option>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={clinical}
                    onChange={(e) => setClinical(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-black/30"
                  />
                  Treat as clinical / patient screener (use published prevalence,
                  no panel uplift)
                </label>

                <Field label="Extra notes for the AI">
                  <textarea
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    rows={3}
                    placeholder={`e.g. "Exclude anyone on statins. Penetration for this brand is ~4% in the UK."`}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
                  />
                </Field>
              </div>
            </details>
          )}

          <button
            type="submit"
            disabled={
              pending || csDescription.trim().length < 3 || !assumedIR || !market
            }
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black transition disabled:opacity-50"
          >
            {pending ? "Validating..." : hasAnswered ? "Re-validate" : "Validate IR"}
          </button>
        </form>

        {/* Right — output */}
        <div className="space-y-6">
          {!response && !error && !pending && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-10 text-center text-white/40">
              Describe the sample, pick a market, enter the assumed IR, and the
              AI will reconstruct the IR independently.
            </div>
          )}

          {pending && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
              Reconstructing the funnel and validating the assumed IR...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <h3 className="font-semibold text-red-300">
                {error.error === "calibrator_failed"
                  ? "AI calibrator failed"
                  : `Error: ${error.error}`}
              </h3>
              {error.detail && (
                <p className="mt-2 text-sm text-red-200/80">{error.detail}</p>
              )}
              {error.raw && (
                <pre className="mt-3 max-h-48 overflow-auto rounded bg-black/40 p-3 text-xs text-white/70">
                  {error.raw}
                </pre>
              )}
            </div>
          )}

          {response && <IRResultCard result={response.result} />}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs uppercase tracking-wide text-white/60">
        {label}
      </span>
      {children}
    </label>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { VerdictCard } from "./VerdictCard";
import { CriteriaBreakdown } from "./CriteriaBreakdown";
import type { CalcResult, ParsedCriteria } from "@/lib/benchmarks/types";

interface Props {
  markets: string[];
}

interface ValidateResponse {
  ok: true;
  criteria: ParsedCriteria;
  result: CalcResult;
}
interface ValidateError {
  ok?: false;
  error: string;
  detail?: string;
  raw?: string;
  details?: unknown;
}

type Gender = "male" | "female" | "all";
type Seg = "ABC1" | "ABC1C2" | "ABC1C2D" | "all" | "";
type Category =
  | "financial"
  | "fmcg"
  | "tech"
  | "auto"
  | "healthcare"
  | "other"
  | "";
type GeoType = "national" | "cities" | "regions";
type Recency = "P3M" | "P6M" | "P12M" | "ever" | "";
type Frequency = "heavy" | "medium" | "light" | "";
type BrandSpec = "category_only" | "specific_brand" | "niche_premium" | "";
type PanelType = "online" | "cati" | "f2f" | "hybrid";

export function CalculatorForm({ markets }: Props) {
  const [market, setMarket] = useState(markets[0] ?? "");
  const [panelType, setPanelType] = useState<PanelType>("online");
  const [assumedIR, setAssumedIR] = useState<string>("");
  const [targetN, setTargetN] = useState<string>("");

  const [ageMin, setAgeMin] = useState<string>("");
  const [ageMax, setAgeMax] = useState<string>("");
  const [gender, setGender] = useState<Gender>("all");
  const [seg, setSeg] = useState<Seg>("");
  const [category, setCategory] = useState<Category>("");
  const [geoType, setGeoType] = useState<GeoType>("national");
  const [citiesStr, setCitiesStr] = useState<string>("");
  const [recency, setRecency] = useState<Recency>("");
  const [frequency, setFrequency] = useState<Frequency>("");
  const [brandSpec, setBrandSpec] = useState<BrandSpec>("");
  const [logic, setLogic] = useState<"AND" | "OR">("AND");
  const [clinical, setClinical] = useState(false);

  const [screener, setScreener] = useState("");

  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [pending, setPending] = useState(false);
  const [response, setResponse] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<ValidateError | null>(null);

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    setResponse(null);
    setError(null);
    try {
      const cities = citiesStr
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      const body: Record<string, unknown> = {
        screener,
        market,
        panel_type: panelType,
        gender,
        geo_type: geoType,
        logic,
        clinical,
      };
      if (assumedIR) body.assumed_ir = Number(assumedIR);
      if (targetN) body.target_n = Number(targetN);
      if (ageMin) body.age_min = Number(ageMin);
      if (ageMax) body.age_max = Number(ageMax);
      if (seg) body.seg = seg;
      if (category) body.category = category;
      if (geoType === "cities" && cities.length > 0) body.cities = cities;
      if (recency) body.recency = recency;
      if (frequency) body.frequency = frequency;
      if (brandSpec) body.brand_specificity = brandSpec;

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

  return (
    <div className="mx-auto max-w-6xl p-6">
      <header className="mb-8 flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-semibold">IR Validator</h1>
          <p className="text-sm text-white/60">
            Answer the initial questions, then validate — the calculator
            returns the IR remaining after every filter is applied.
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
        {/* Left — structured intake */}
        <form
          onSubmit={submit}
          className="space-y-5 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <Section title="Project">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Market">
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className={inputCls}
                >
                  {markets.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Target N">
                <input
                  type="number"
                  min={1}
                  value={targetN}
                  onChange={(e) => setTargetN(e.target.value)}
                  placeholder="e.g. 300"
                  className={inputCls}
                />
              </Field>

              <Field label="Assumed IR (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={assumedIR}
                  onChange={(e) => setAssumedIR(e.target.value)}
                  placeholder="e.g. 9"
                  className={inputCls}
                />
              </Field>

              <Field label="Logic between qualifiers">
                <select
                  value={logic}
                  onChange={(e) => setLogic(e.target.value as "AND" | "OR")}
                  className={inputCls}
                >
                  <option value="AND">AND (all must apply)</option>
                  <option value="OR">OR (any can apply)</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Demographics">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Age min">
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={ageMin}
                  onChange={(e) => setAgeMin(e.target.value)}
                  placeholder="e.g. 25"
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
                  placeholder="e.g. 54"
                  className={inputCls}
                />
              </Field>

              <Field label="Gender">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={inputCls}
                >
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
                  <option value="">—</option>
                  <option value="ABC1">ABC1</option>
                  <option value="ABC1C2">ABC1C2</option>
                  <option value="ABC1C2D">ABC1C2D</option>
                  <option value="all">all</option>
                </select>
              </Field>
            </div>
          </Section>

          <Section title="Geography">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Geo coverage">
                <select
                  value={geoType}
                  onChange={(e) => setGeoType(e.target.value as GeoType)}
                  className={inputCls}
                >
                  <option value="national">national</option>
                  <option value="cities">specific cities</option>
                  <option value="regions">regions</option>
                </select>
              </Field>
              {geoType === "cities" && (
                <Field label="Cities (comma-separated)">
                  <input
                    type="text"
                    value={citiesStr}
                    onChange={(e) => setCitiesStr(e.target.value)}
                    placeholder="São Paulo, Rio, Belo Horizonte"
                    className={inputCls}
                  />
                </Field>
              )}
            </div>
          </Section>

          <Section title="Behaviour & brand">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className={inputCls}
                >
                  <option value="">—</option>
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
                  <option value="">—</option>
                  <option value="P3M">past 3 months</option>
                  <option value="P6M">past 6 months</option>
                  <option value="P12M">past 12 months</option>
                  <option value="ever">ever</option>
                </select>
              </Field>

              <Field label="Frequency">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as Frequency)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="heavy">heavy</option>
                  <option value="medium">medium</option>
                  <option value="light">light</option>
                </select>
              </Field>

              <Field label="Brand specificity">
                <select
                  value={brandSpec}
                  onChange={(e) => setBrandSpec(e.target.value as BrandSpec)}
                  className={inputCls}
                >
                  <option value="">—</option>
                  <option value="category_only">any brand in category</option>
                  <option value="specific_brand">specific brand</option>
                  <option value="niche_premium">premium / niche</option>
                </select>
              </Field>
            </div>

            <label className="mt-3 flex items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={clinical}
                onChange={(e) => setClinical(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-black/30"
              />
              Clinical / patient screener (diagnosed condition — suppresses
              panel uplift)
            </label>
          </Section>

          <Section title="Additional screener details (optional)">
            <p className="mb-2 text-xs text-white/50">
              Paste attitudinal statements, hard exclusions, diagnosed
              conditions, or any free-text filter the structured fields above
              don&apos;t cover. The LLM will extract only those — every number
              still comes from the benchmark funnel.
            </p>
            <textarea
              value={screener}
              onChange={(e) => setScreener(e.target.value)}
              rows={6}
              placeholder={`e.g. "Considers themselves an early tech adopter; excludes market-research employees and anyone on statins."`}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
            />
          </Section>

          <details
            open={advancedOpen}
            onToggle={(e) =>
              setAdvancedOpen((e.target as HTMLDetailsElement).open)
            }
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            <summary className="cursor-pointer select-none text-white/70">
              Advanced — panel type
            </summary>
            <div className="mt-3">
              <Field label="Panel type (default online)">
                <select
                  value={panelType}
                  onChange={(e) => setPanelType(e.target.value as PanelType)}
                  className={inputCls}
                >
                  <option value="online">online</option>
                  <option value="cati">CATI</option>
                  <option value="f2f">face-to-face</option>
                  <option value="hybrid">hybrid</option>
                </select>
              </Field>
            </div>
          </details>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black transition disabled:opacity-50"
          >
            {pending ? "Validating..." : "Validate IR"}
          </button>
        </form>

        {/* Right — output */}
        <div className="space-y-6">
          {!response && !error && !pending && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-10 text-center text-white/40">
              Answer the initial questions on the left and hit Validate.
              You&apos;ll get the IR remaining after every filter is applied.
            </div>
          )}

          {pending && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
              Assessing the sample and computing IR remaining...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
              <h3 className="font-semibold text-red-300">
                {error.error === "parser_failed"
                  ? "Parser failed"
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

          {response && (
            <>
              <VerdictCard result={response.result} />
              <CriteriaBreakdown
                criteria={response.criteria}
                layers={response.result.layers}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-white/60">
        {title}
      </h3>
      {children}
    </section>
  );
}

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

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

export function CalculatorForm({ markets }: Props) {
  const [screener, setScreener] = useState("");
  const [market, setMarket] = useState(markets[0] ?? "");
  const [panelType, setPanelType] = useState<"online" | "cati" | "f2f" | "hybrid">(
    "online",
  );
  const [assumedIR, setAssumedIR] = useState<string>("");
  const [targetN, setTargetN] = useState<string>("");

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
      const body: Record<string, unknown> = {
        screener,
        market,
        panel_type: panelType,
      };
      if (assumedIR) body.assumed_ir = Number(assumedIR);
      if (targetN) body.target_n = Number(targetN);

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
            Three-layer feasibility check — LLM parses, benchmarks compute.
          </p>
        </div>
        <button
          onClick={logout}
          className="text-sm text-white/60 underline hover:text-white"
        >
          Logout
        </button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        {/* Left — inputs */}
        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6"
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Market">
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30"
              >
                {markets.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Panel type">
              <select
                value={panelType}
                onChange={(e) => setPanelType(e.target.value as any)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30"
              >
                <option value="online">online</option>
                <option value="cati">CATI</option>
                <option value="f2f">face-to-face</option>
                <option value="hybrid">hybrid</option>
              </select>
            </Field>

            <Field label="Assumed IR (%)">
              <input
                type="number"
                min={0}
                max={100}
                step="0.1"
                value={assumedIR}
                onChange={(e) => setAssumedIR(e.target.value)}
                placeholder="e.g. 35"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30"
              />
            </Field>

            <Field label="Target N">
              <input
                type="number"
                min={1}
                value={targetN}
                onChange={(e) => setTargetN(e.target.value)}
                placeholder="e.g. 300"
                className="w-full rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm outline-none focus:border-white/30"
              />
            </Field>
          </div>

          <Field label="Screener text">
            <textarea
              value={screener}
              onChange={(e) => setScreener(e.target.value)}
              rows={12}
              placeholder="Paste the full screener / sample description here..."
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none focus:border-white/30"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={pending || screener.length < 10}
            className="w-full rounded-lg bg-white px-4 py-2 font-medium text-black transition disabled:opacity-50"
          >
            {pending ? "Validating..." : "Validate IR"}
          </button>
        </form>

        {/* Right — output */}
        <div className="space-y-6">
          {!response && !error && !pending && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-10 text-center text-white/40">
              Paste a screener and hit Validate to see the verdict.
            </div>
          )}

          {pending && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-10 text-center text-white/60">
              Parsing screener and computing IR...
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

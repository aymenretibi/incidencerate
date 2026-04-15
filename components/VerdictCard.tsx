import type { CalcResult, Verdict } from "@/lib/benchmarks/types";

const VERDICT_STYLES: Record<
  Verdict,
  { bg: string; ring: string; label: string; description: string }
> = {
  ACCURATE: {
    bg: "bg-emerald-500/15",
    ring: "ring-emerald-400/50",
    label: "text-emerald-300",
    description: "Assumed IR is within the modelled range — safe to quote.",
  },
  BORDERLINE: {
    bg: "bg-amber-500/15",
    ring: "ring-amber-400/50",
    label: "text-amber-300",
    description:
      "Assumed IR is slightly above the modelled ceiling — flag as risk; recommend IR reduction.",
  },
  TOO_HIGH: {
    bg: "bg-red-500/15",
    ring: "ring-red-400/50",
    label: "text-red-300",
    description:
      "Assumed IR exceeds the modelled ceiling by more than 8% — quote will under-estimate cost; margin at risk.",
  },
  TOO_LOW: {
    bg: "bg-sky-500/15",
    ring: "ring-sky-400/50",
    label: "text-sky-300",
    description:
      "Assumed IR is below the conservative floor — safe to quote but may overprice the project.",
  },
};

export function VerdictCard({ result }: { result: CalcResult }) {
  const s = VERDICT_STYLES[result.verdict];
  const gap =
    result.assumed_ir == null ? null : result.assumed_ir - result.ir_point;

  return (
    <div className={`rounded-2xl p-6 ring-1 ${s.bg} ${s.ring}`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-3xl font-bold tracking-tight ${s.label}`}>
          {result.verdict.replace("_", " ")}
        </span>
        <span className="text-xs uppercase tracking-widest text-white/60">
          confidence: {result.confidence}
        </span>
      </div>
      <p className="mt-2 text-sm text-white/70">{s.description}</p>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Stat label="IR remaining" value={fmt(result.ir_point)} emphasis />
        <Stat label="Low" value={fmt(result.ir_low)} />
        <Stat label="High" value={fmt(result.ir_high)} />
        <Stat
          label="Assumed IR"
          value={result.assumed_ir == null ? "—" : fmt(result.assumed_ir)}
        />
      </div>

      {gap !== null && (
        <div className="mt-4 text-sm text-white/70">
          Assumed − Estimated ={" "}
          <span
            className={
              Math.abs(gap) > 10 ? "text-red-300 font-semibold" : "text-white"
            }
          >
            {gap > 0 ? "+" : ""}
            {gap.toFixed(1)} pts
          </span>
        </div>
      )}

      {result.confidence_reason && (
        <div className="mt-3 rounded-md border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/60">
          {result.confidence_reason}
        </div>
      )}

      <div className="mt-4 rounded-md border border-white/10 bg-black/20 px-3 py-3 text-sm text-white/80">
        {result.short_reason}
      </div>

      <div className="mt-4 text-xs text-white/50">
        Market group: {result.market_group.replace(/_/g, " ")} · {" "}
        {result.market_calibration.note}
      </div>
      <div className="mt-1 text-xs text-white/50">
        Panel uplift: ×{result.panel_uplift.toFixed(3)} — {result.panel_uplift_reason}
      </div>

      {result.notes.length > 0 && (
        <ul className="mt-4 space-y-1 text-xs text-white/60">
          {result.notes.map((n, i) => (
            <li key={i}>• {n}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function fmt(n: number): string {
  if (n < 1) return `${n.toFixed(2)}%`;
  if (n < 10) return `${n.toFixed(1)}%`;
  return `${Math.round(n)}%`;
}

function Stat({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-white/50">{label}</div>
      <div
        className={`mt-1 font-semibold ${
          emphasis ? "text-2xl text-white" : "text-lg text-white/90"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

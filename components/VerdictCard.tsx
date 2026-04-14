import type { CalcResult } from "@/lib/benchmarks/types";

const VERDICT_STYLES: Record<
  CalcResult["verdict"],
  { bg: string; ring: string; label: string }
> = {
  ACCEPT: { bg: "bg-emerald-500/15", ring: "ring-emerald-400/50", label: "text-emerald-300" },
  REVIEW: { bg: "bg-amber-500/15", ring: "ring-amber-400/50", label: "text-amber-300" },
  REJECT: { bg: "bg-red-500/15", ring: "ring-red-400/50", label: "text-red-300" },
};

export function VerdictCard({ result }: { result: CalcResult }) {
  const s = VERDICT_STYLES[result.verdict];
  const gap =
    result.assumed_ir == null ? null : result.assumed_ir - result.final_ir;

  return (
    <div className={`rounded-2xl p-6 ring-1 ${s.bg} ${s.ring}`}>
      <div className="flex items-baseline justify-between">
        <span className={`text-3xl font-bold tracking-tight ${s.label}`}>
          {result.verdict}
        </span>
        <span className="text-xs uppercase tracking-widest text-white/60">
          confidence: {result.confidence}
        </span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Stat label="Estimated IR" value={`${result.final_ir}%`} emphasis />
        <Stat label="Conservative floor" value={`${result.floor_ir}%`} />
        <Stat
          label="Assumed IR"
          value={result.assumed_ir == null ? "—" : `${result.assumed_ir}%`}
        />
      </div>

      {gap !== null && (
        <div className="mt-4 text-sm text-white/70">
          Assumed − Estimated ={" "}
          <span className={gap > 15 ? "text-red-300 font-semibold" : "text-white"}>
            {gap > 0 ? "+" : ""}
            {gap.toFixed(1)} pts
          </span>
          {result.risk_flag && (
            <span className="ml-2 rounded bg-red-500/20 px-2 py-0.5 text-xs font-semibold uppercase text-red-300">
              risk flag
            </span>
          )}
        </div>
      )}

      <div className="mt-4 text-xs text-white/50">
        base segment: {result.base_segment.replace(/_/g, " ")} · panel:{" "}
        {result.panel_type} · uplift ×{result.uplift.toFixed(3)}
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

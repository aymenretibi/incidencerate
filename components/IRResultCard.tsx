import type { IRResult } from "@/lib/irCalibrator";

const VERDICT_META: Record<
  IRResult["verdict"],
  { label: string; emoji: string; ring: string; bg: string; text: string }
> = {
  TOO_HIGH: {
    label: "TOO HIGH",
    emoji: "⛔",
    ring: "ring-red-400/50",
    bg: "bg-red-500/10",
    text: "text-red-300",
  },
  TOO_LOW: {
    label: "TOO LOW",
    emoji: "⛔",
    ring: "ring-sky-400/50",
    bg: "bg-sky-500/10",
    text: "text-sky-300",
  },
  ACCURATE: {
    label: "ACCURATE",
    emoji: "✅",
    ring: "ring-emerald-400/50",
    bg: "bg-emerald-500/10",
    text: "text-emerald-300",
  },
  BORDERLINE: {
    label: "BORDERLINE",
    emoji: "⚠️",
    ring: "ring-amber-400/50",
    bg: "bg-amber-500/10",
    text: "text-amber-300",
  },
};

function fmt(n: number): string {
  if (n < 1) return `${n.toFixed(2)}%`;
  if (n < 10) return `${n.toFixed(1)}%`;
  return `${Math.round(n)}%`;
}

export function IRResultCard({ result }: { result: IRResult }) {
  const v = VERDICT_META[result.verdict];
  const confidenceReason =
    result.assumption_confidence !== "HIGH" && result.confidence_reason
      ? ` (${result.confidence_reason})`
      : "";

  return (
    <div className={`rounded-2xl p-6 ring-1 ${v.bg} ${v.ring}`}>
      <div className="space-y-1.5 text-sm">
        <Line k="Market" v={result.market} />
        <Line k="Sample Title" v={result.sample_title} />
        <Line k="Predicted IR" v={fmt(result.predicted_ir_point)} bold />
        <Line
          k="Predicted IR Range"
          v={`${fmt(result.predicted_ir_low)} – ${fmt(result.predicted_ir_high)}`}
        />
      </div>

      <div className="my-5 border-t border-white/10" />

      <div className="space-y-1.5 text-sm">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-white/80">Verdict:</span>
          <span className={`text-xl ${v.text}`} aria-hidden>
            {v.emoji}
          </span>
          <span className={`text-lg font-semibold ${v.text}`}>{v.label}</span>
        </div>
        <Line k="Assumed IR" v={`${fmt(result.assumed_ir)}`} />
        <Line k="Sample Description" v={result.sample_description} />
        <Line k="Short Reason" v={result.short_reason} />
        <Line
          k="Assumption Confidence"
          v={`${result.assumption_confidence}${confidenceReason}`}
        />
      </div>
    </div>
  );
}

function Line({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="font-bold text-white/80">{k}:</span>
      <span className={bold ? "font-bold text-white" : "text-white/90"}>
        {v}
      </span>
    </div>
  );
}

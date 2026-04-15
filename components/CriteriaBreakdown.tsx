import type {
  FunnelLayer,
  ParsedCriteria,
  RestrictionLevel,
} from "@/lib/benchmarks/types";

const LEVEL_STYLE: Record<RestrictionLevel, string> = {
  Broad: "bg-emerald-500/15 text-emerald-300",
  Medium: "bg-amber-500/15 text-amber-300",
  Narrow: "bg-orange-500/15 text-orange-300",
  VeryNarrow: "bg-red-500/15 text-red-300",
};

const SOURCE_STYLE: Record<FunnelLayer["source"], string> = {
  benchmark: "text-emerald-300",
  prevalence: "text-sky-300",
  assumed: "text-amber-300",
};

export function CriteriaBreakdown({
  criteria,
  layers,
}: {
  criteria: ParsedCriteria;
  layers: FunnelLayer[];
}) {
  // Compute cumulative survivors for visualisation.
  let acc = 1;
  const withRunning = layers.map((l) => {
    acc *= l.passRate.point;
    return { layer: l, cumulative: acc };
  });

  return (
    <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
          Parsed criteria
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <Row k="Market" v={criteria.market ?? "—"} />
          <Row k="Target N" v={criteria.target_n?.toString() ?? "—"} />
          <Row
            k="Age"
            v={
              criteria.age_min == null && criteria.age_max == null
                ? "all adults"
                : `${criteria.age_min ?? "?"}–${criteria.age_max ?? "?"}`
            }
          />
          <Row k="Gender" v={criteria.gender} />
          <Row k="Segment" v={criteria.seg ?? "—"} />
          <Row k="Category" v={criteria.category ?? "—"} />
          <Row
            k="Geo"
            v={
              criteria.geo_restriction.type === "national"
                ? "national"
                : criteria.geo_restriction.type === "cities"
                ? `${criteria.geo_restriction.count ?? criteria.geo_restriction.cities?.length ?? "?"} cities (${(criteria.geo_restriction.cities ?? []).join(", ")})`
                : "regions"
            }
          />
          <Row k="Logic" v={criteria.logic} />
          <Row k="Panel" v={criteria.panel_type ?? "—"} />
          <Row k="Recency" v={criteria.recency ?? "—"} />
          <Row k="Frequency" v={criteria.frequency ?? "—"} />
          <Row k="Brand" v={criteria.brand_specificity ?? "—"} />
          <Row k="Clinical" v={criteria.clinical ? "yes" : "no"} />
        </dl>
      </section>

      {criteria.qualifiers.length > 0 && (
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
            Qualifiers
          </h3>
          <ul className="space-y-1 text-sm">
            {criteria.qualifiers.map((q, i) => (
              <li key={i} className="flex gap-2">
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-white/70">
                  {q.kind}
                </span>
                <span className="text-white/90">{q.value}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {criteria.attitudinal.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Attitudinal filters
          </h3>
          <ul className="list-disc pl-5 text-sm text-white/80">
            {criteria.attitudinal.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </section>
      )}

      {criteria.exclusions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Hard exclusions
          </h3>
          <ul className="list-disc pl-5 text-sm text-white/80">
            {criteria.exclusions.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
          Screening funnel
        </h3>
        {layers.length === 0 ? (
          <p className="text-sm text-white/60">
            No layers detected — base 100% passes through.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-white/50">
                <tr>
                  <th className="py-1 text-left">Layer</th>
                  <th className="py-1 text-right">Pass rate</th>
                  <th className="py-1 text-right">Level</th>
                  <th className="py-1 text-right">Cumulative</th>
                  <th className="py-1 text-right">Source</th>
                </tr>
              </thead>
              <tbody>
                {withRunning.map(({ layer, cumulative }, i) => (
                  <tr key={i} className="border-t border-white/5 align-top">
                    <td className="py-1.5 pr-2 text-white/90">
                      {layer.label}
                      {layer.note && (
                        <div className="mt-0.5 text-xs text-white/50">
                          {layer.note}
                        </div>
                      )}
                    </td>
                    <td className="whitespace-nowrap py-1.5 text-right text-white/80">
                      {fmt(layer.passRate.low)}–{fmt(layer.passRate.high)}
                      <div className="text-xs text-white/50">
                        pt {fmt(layer.passRate.point)}
                      </div>
                    </td>
                    <td className="py-1.5 text-right">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${LEVEL_STYLE[layer.level]}`}
                      >
                        {layer.level === "VeryNarrow"
                          ? "very narrow"
                          : layer.level.toLowerCase()}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-white/80">
                      {fmt(cumulative)}
                    </td>
                    <td className="py-1.5 text-right text-xs">
                      <span className={SOURCE_STYLE[layer.source]}>
                        {layer.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {criteria.notes && (
        <section>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/70">
            Parser notes
          </h3>
          <p className="text-sm text-white/70">{criteria.notes}</p>
        </section>
      )}
    </div>
  );
}

function fmt(frac: number): string {
  const pct = frac * 100;
  if (pct < 1) return `${pct.toFixed(2)}%`;
  if (pct < 10) return `${pct.toFixed(1)}%`;
  return `${Math.round(pct)}%`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-white/50">{k}</dt>
      <dd className="text-white/90">{v}</dd>
    </>
  );
}

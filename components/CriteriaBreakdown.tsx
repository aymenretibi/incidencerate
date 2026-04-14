import type { AppliedModifier, ParsedCriteria } from "@/lib/benchmarks/types";

export function CriteriaBreakdown({
  criteria,
  applied,
}: {
  criteria: ParsedCriteria;
  applied: AppliedModifier[];
}) {
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

      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/70">
          Modifiers applied
        </h3>
        {applied.length === 0 ? (
          <p className="text-sm text-white/60">
            No modifiers applied — base IR used directly.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-white/50">
              <tr>
                <th className="py-1 text-left">Modifier</th>
                <th className="py-1 text-right">Min</th>
                <th className="py-1 text-right">Max</th>
                <th className="py-1 text-right">Source</th>
              </tr>
            </thead>
            <tbody>
              {applied.map((m, i) => (
                <tr key={i} className="border-t border-white/5">
                  <td className="py-1.5 text-white/90">{m.label}</td>
                  <td className="py-1.5 text-right text-white/70">
                    ×{m.range.min.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right text-white/70">
                    ×{m.range.max.toFixed(2)}
                  </td>
                  <td className="py-1.5 text-right text-xs text-white/50">
                    {m.source}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-white/50">{k}</dt>
      <dd className="text-white/90">{v}</dd>
    </>
  );
}

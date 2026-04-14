import { BASE_IR } from "./benchmarks/baseIR";
import { MODIFIERS } from "./benchmarks/modifiers";
import { PANEL_UPLIFT } from "./benchmarks/panelUplift";
import type {
  AgeBand,
  AppliedModifier,
  CalcResult,
  Confidence,
  IncomeTier,
  ModifierRange,
  ParsedCriteria,
  PanelType,
  ProjectType,
  Segment,
  Verdict,
} from "./benchmarks/types";

const IDENTITY: ModifierRange = { min: 1, max: 1 };

function mid(r: ModifierRange): number {
  return (r.min + r.max) / 2;
}

function inferSegment(p: ParsedCriteria): Segment {
  const seg = p.seg;
  const amin = p.age_min ?? 18;
  const amax = p.age_max ?? 99;

  if (seg === "ABC1") return "abc1";
  if (seg === "ABC1C2") return "abc1c2";
  if (seg === "ABC1C2D") return "abc1c2d";

  if (p.gender === "female" && amax <= 45 && amin >= 18) return "women_18_45";
  if (p.gender === "male" && amin >= 25 && amax <= 54) return "men_25_54";
  if (amin >= 18 && amax <= 34) return "adults_18_34";

  return "general_population";
}

function inferAgeBand(p: ParsedCriteria): AgeBand {
  const { age_min, age_max } = p;
  if (age_min == null && age_max == null) return "all_adults";
  const lo = age_min ?? 18;
  const hi = age_max ?? 99;
  const span = hi - lo;

  if (span <= 6) return "narrow_custom";
  if (lo >= 18 && hi <= 24) return "18_24";
  if (lo >= 18 && hi <= 34) return "18_34";
  if (lo >= 25 && hi <= 54) return "25_54";
  if (lo >= 35 && hi <= 54) return "35_54";
  if (lo >= 55) return "55_plus";
  return "all_adults";
}

function inferGeoKey(
  p: ParsedCriteria,
): keyof typeof MODIFIERS.geo {
  const g = p.geo_restriction;
  if (g.type === "national") return "national";
  if (g.type === "regions") return "regions_few";
  const n = g.count ?? g.cities?.length ?? 0;
  if (n <= 1) return "cities_1";
  if (n <= 3) return "cities_2_3";
  return "cities_4_10";
}

/**
 * Income tier inference.
 *
 * IMPORTANT: if the parsed seg is ABC1 / ABC1C2 / ABC1C2D, the income is
 * *already captured by the base IR segment lookup* (abc1 base ≈ 20–45% of
 * population depending on tier). We must NOT add a second income modifier
 * on top of that, or we'd double-count.
 *
 * We only return a non-"all" tier when the income signal comes from the
 * qualifier text and is *orthogonal* to the base segment.
 */
function inferIncome(p: ParsedCriteria): IncomeTier {
  const txt = p.qualifiers
    .map((q) => q.value)
    .join(" ")
    .toLowerCase();
  if (/hnwi|ultra[- ]?high net worth|\$\s*1m|high[- ]net[- ]worth/.test(txt)) return "hnwi";
  if (/top quintile|top\s*10%|top\s*20%/.test(txt)) return "top_quintile";

  // Only apply SES-derived income if base IR didn't already segment on SES.
  if (!p.seg || p.seg === "all") {
    if (/premium|affluent|high[- ]income|wealthy/.test(txt)) return "top_quintile";
  }
  return "all";
}

function inferConditionTier(p: ParsedCriteria): keyof typeof MODIFIERS.condition {
  const condQuals = p.qualifiers.filter((q) => q.kind === "condition");
  if (condQuals.length === 0) return "none";
  const joined = condQuals.map((q) => q.value).join(" ").toLowerCase();
  if (/rare|orphan|stage\s*iv|stage\s*4/.test(joined)) return "rare";
  if (/diabetes|copd|rheumatoid|cancer|hepatitis|crohn/.test(joined)) return "moderate";
  return "common";
}

function isClinical(p: ParsedCriteria): boolean {
  return p.category === "healthcare" || p.qualifiers.some((q) => q.kind === "condition");
}

export function calculate(
  parsed: ParsedCriteria,
  market: string,
  panelType: PanelType,
): CalcResult {
  const notes: string[] = [];
  const applied: AppliedModifier[] = [];

  // Base IR lookup
  const segment = inferSegment(parsed);
  const marketTable = BASE_IR[market];
  if (!marketTable) {
    throw new Error(`Unknown market "${market}"`);
  }
  const baseEntry = marketTable[segment] ?? marketTable.general_population;
  if (!baseEntry) {
    throw new Error(`No base IR for ${market}/${segment}`);
  }
  if (!marketTable[segment]) {
    notes.push(
      `No specific base IR for segment "${segment}" in ${market}; fell back to general_population.`,
    );
  }

  // Category
  const catKey = parsed.category;
  if (catKey) {
    const range = MODIFIERS.category[catKey];
    applied.push({ label: `category:${catKey}`, range, source: "exact" });
  } else {
    notes.push("No category detected; skipping category modifier.");
  }

  // Geo
  const geoKey = inferGeoKey(parsed);
  if (geoKey !== "national") {
    const range = MODIFIERS.geo[geoKey];
    const label =
      geoKey === "cities_1"
        ? "geo:1 city"
        : geoKey === "cities_2_3"
        ? `geo:${parsed.geo_restriction.count ?? parsed.geo_restriction.cities?.length ?? 2}–3 cities`
        : geoKey === "cities_4_10"
        ? `geo:${parsed.geo_restriction.count ?? parsed.geo_restriction.cities?.length ?? 4}+ cities`
        : "geo:regions";
    applied.push({ label, range, source: "exact" });
  }

  // Age
  const ageKey = inferAgeBand(parsed);
  if (ageKey !== "all_adults") {
    applied.push({
      label: `age:${parsed.age_min ?? "?"}–${parsed.age_max ?? "?"}`,
      range: MODIFIERS.age[ageKey],
      source: "exact",
    });
  }

  // Gender
  if (parsed.gender !== "all") {
    applied.push({
      label: `gender:${parsed.gender}`,
      range: MODIFIERS.gender[parsed.gender],
      source: "exact",
    });
  }

  // Condition
  const conditionTier = inferConditionTier(parsed);
  if (conditionTier !== "none") {
    applied.push({
      label: `condition:${conditionTier}`,
      range: MODIFIERS.condition[conditionTier],
      source: conditionTier === "common" ? "category_default" : "exact",
    });
  }

  // Income
  const incomeTier = inferIncome(parsed);
  if (incomeTier !== "all") {
    applied.push({
      label: `income:${incomeTier}`,
      range: MODIFIERS.income[incomeTier],
      source: "exact",
    });
  }

  // OR logic softens the effect of stacked qualifiers: multiply qualifier
  // modifiers' midpoints with a 1.3× widening, floored at 1.0 per modifier.
  const orSoftening = parsed.logic === "OR" && applied.length > 1;
  if (orSoftening) {
    notes.push("OR-logic screener: qualifier penalties softened.");
  }

  const productMid = applied.reduce((acc, m) => {
    const v = orSoftening ? Math.min(1, mid(m.range) * 1.3) : mid(m.range);
    return acc * v;
  }, 1);
  const productMin = applied.reduce((acc, m) => {
    const v = orSoftening ? Math.min(1, m.range.min * 1.3) : m.range.min;
    return acc * v;
  }, 1);

  // Panel uplift
  const projectType: ProjectType = isClinical(parsed) ? "clinical" : "nonclinical";
  const uplift = PANEL_UPLIFT[panelType][projectType];

  const final = baseEntry.point * productMid * uplift;
  const floor = baseEntry.floor * productMin * uplift;

  const finalClamped = Math.min(100, Math.max(0, final));
  const floorClamped = Math.min(100, Math.max(0, floor));

  // Verdict
  const assumed = parsed.assumed_ir;
  let verdict: Verdict;
  let riskFlag = false;

  if (assumed == null) {
    verdict = "REVIEW";
    notes.push("No assumed IR provided; verdict defaulted to REVIEW.");
  } else if (assumed - finalClamped > 15) {
    verdict = "REJECT";
    riskFlag = true;
  } else if (assumed <= finalClamped * 1.05 && assumed >= floorClamped * 0.95) {
    verdict = "ACCEPT";
  } else {
    verdict = "REVIEW";
  }

  // Confidence
  const exactCount = applied.filter((m) => m.source === "exact").length;
  const defaultCount = applied.filter((m) => m.source === "category_default").length;
  const fallbackCount = applied.filter((m) => m.source === "fallback").length;

  let confidence: Confidence;
  if (fallbackCount === 0 && defaultCount === 0 && exactCount >= applied.length) {
    confidence = "high";
  } else if (fallbackCount === 0 && defaultCount <= 1) {
    confidence = "medium";
  } else {
    confidence = "low";
  }
  if (applied.length === 0) confidence = "low";

  return {
    verdict,
    confidence,
    final_ir: round(finalClamped),
    floor_ir: round(floorClamped),
    assumed_ir: assumed,
    modifiers_applied: applied,
    base_segment: segment,
    panel_type: panelType,
    uplift,
    risk_flag: riskFlag,
    notes,
  };
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

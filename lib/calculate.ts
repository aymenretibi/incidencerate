import { SES_PENETRATION } from "./benchmarks/baseIR";
import {
  AGE_BANDS,
  ATTITUDINAL,
  BRAND_ANY,
  BRAND_NICHE_PREMIUM,
  BRAND_SPECIFIC,
  CATEGORY_EVER,
  CATEGORY_P12M,
  CATEGORY_P3M,
  CONDITION_COMMON,
  CONDITION_MODERATE,
  CONDITION_RARE,
  EXCLUSION_PER,
  GENDER_RANGE,
  GEO_BANDS,
  HEAVY_USER,
  INCOME_HNWI,
  INCOME_TOP_QUINTILE,
  LIGHT_USER,
  MEDIUM_USER,
  classifyLevel,
} from "./benchmarks/funnelDefaults";
import { getCalibration, getMarketGroup } from "./benchmarks/marketCalibration";
import { resolveUplift } from "./benchmarks/panelUplift";
import type {
  CalcResult,
  Confidence,
  FunnelLayer,
  LayerKind,
  LayerSource,
  MarketCalibration,
  PanelType,
  ParsedCriteria,
  Range,
  UpliftClass,
  Verdict,
} from "./benchmarks/types";

// -----------------------------------------------------------------------------
// Range helpers
// -----------------------------------------------------------------------------

const IDENTITY: Range = { low: 1, point: 1, high: 1 };

function clampRange(r: Range, min = 0, max = 1): Range {
  return {
    low: Math.min(max, Math.max(min, r.low)),
    point: Math.min(max, Math.max(min, r.point)),
    high: Math.min(max, Math.max(min, r.high)),
  };
}

function scaleRange(r: Range, factor: number): Range {
  return { low: r.low * factor, point: r.point * factor, high: r.high * factor };
}

/** Widen a range around its point estimate by `factor` (1.25 ⇒ 25% wider). */
function widen(r: Range, factor: number): Range {
  if (factor <= 1) return r;
  const low = r.point - (r.point - r.low) * factor;
  const high = r.point + (r.high - r.point) * factor;
  return { low: Math.max(0, low), point: r.point, high };
}

function multiplyRanges(a: Range, b: Range): Range {
  return { low: a.low * b.low, point: a.point * b.point, high: a.high * b.high };
}

/**
 * Rule 4A — OR-logic union:   1 − Π(1 − p_i).
 *
 * Applied per low/point/high independently. The high bound gets an extra
 * widening factor because overlap between the OR branches is uncertain.
 */
function unionRanges(ranges: Range[]): Range {
  if (ranges.length === 0) return { low: 0, point: 0, high: 0 };
  const unionAt = (pick: (r: Range) => number) =>
    1 - ranges.reduce((acc, r) => acc * (1 - pick(r)), 1);
  const low = unionAt((r) => r.low);
  const point = unionAt((r) => r.point);
  const high = unionAt((r) => r.high);
  return { low: Math.max(0, low), point, high: Math.min(1, high * 1.1) };
}

// -----------------------------------------------------------------------------
// Layer builders — each returns a FunnelLayer or null
// -----------------------------------------------------------------------------

function layer(
  kind: LayerKind,
  label: string,
  passRate: Range,
  upliftClass: UpliftClass,
  source: LayerSource,
  note?: string,
): FunnelLayer {
  return {
    kind,
    label,
    passRate,
    upliftClass,
    source,
    level: classifyLevel(passRate.point),
    note,
  };
}

function buildGeoLayer(
  p: ParsedCriteria,
  cal: MarketCalibration,
): FunnelLayer | null {
  const g = p.geo_restriction;
  if (g.type === "national") return null;

  let key: keyof typeof GEO_BANDS;
  let countLabel = "";

  if (g.type === "regions") {
    key = "regions_few";
    countLabel = "region subset";
  } else {
    const n = g.count ?? g.cities?.length ?? 0;
    if (n <= 1) {
      key = "cities_1";
      countLabel = g.cities?.[0] ?? "1 city";
    } else if (n <= 3) {
      key = "cities_2_3";
      countLabel = `${n} cities`;
    } else {
      key = "cities_4_10";
      countLabel = `${n} cities`;
    }
  }

  const base = GEO_BANDS[key];
  const cal_applied = scaleRange(base, cal.geoLoosen);
  return layer(
    "demographic_geo",
    `Geo: ${countLabel}`,
    clampRange(cal_applied),
    "none",
    "assumed",
    cal.geoLoosen !== 1 ? "Geo loosened by market calibration." : undefined,
  );
}

function buildAgeLayer(p: ParsedCriteria): FunnelLayer | null {
  const { age_min, age_max } = p;
  if (age_min == null && age_max == null) return null;

  const lo = age_min ?? 18;
  const hi = age_max ?? 99;
  const span = hi - lo;

  let key: keyof typeof AGE_BANDS;
  if (span <= 6) key = "narrow_custom";
  else if (lo >= 18 && hi <= 24) key = "18_24";
  else if (lo >= 18 && hi <= 34) key = "18_34";
  else if (lo >= 25 && hi <= 54) key = "25_54";
  else if (lo >= 35 && hi <= 54) key = "35_54";
  else if (lo >= 55) key = "55_plus";
  else key = "all_adults";

  if (key === "all_adults") return null;
  return layer(
    "demographic_age",
    `Age ${lo}–${hi === 99 ? "+" : hi}`,
    AGE_BANDS[key],
    "none",
    "benchmark",
  );
}

function buildGenderLayer(p: ParsedCriteria): FunnelLayer | null {
  if (p.gender === "all") return null;
  return layer(
    "demographic_gender",
    `Gender: ${p.gender}`,
    GENDER_RANGE,
    "none",
    "benchmark",
  );
}

function buildSesLayer(
  p: ParsedCriteria,
  market: string,
  cal: MarketCalibration,
): FunnelLayer | null {
  if (!p.seg || p.seg === "all") return null;
  const marketRow = SES_PENETRATION[market];
  if (!marketRow) return null;

  const key =
    p.seg === "ABC1" ? "abc1" : p.seg === "ABC1C2" ? "abc1c2" : "abc1c2d";
  const base = marketRow[key];
  const calApplied = scaleRange(base, cal.sesTighten);

  return layer(
    "ses",
    `SES: ${p.seg}`,
    clampRange(calApplied),
    "none",
    "benchmark",
    cal.sesTighten !== 1 ? "SES tightened by market calibration." : undefined,
  );
}

function buildCategoryLayer(p: ParsedCriteria): FunnelLayer | null {
  if (!p.category || p.category === "other") return null;
  if (p.clinical) return null; // condition layer handles it instead

  const hasCategoryBehaviour = p.qualifiers.some((q) => q.kind === "behaviour");
  if (!hasCategoryBehaviour && !p.recency) return null;

  let base: Range;
  let label: string;
  if (p.recency === "P3M" || p.frequency === "heavy") {
    base = CATEGORY_P3M;
    label = `Category buyer/user P3M (${p.category})`;
  } else if (p.recency === "P12M" || p.recency === "P6M") {
    base = CATEGORY_P12M;
    label = `Category buyer/user P12M (${p.category})`;
  } else if (p.recency === "ever") {
    base = CATEGORY_EVER;
    label = `Category ever-used (${p.category})`;
  } else {
    base = CATEGORY_P12M;
    label = `Category user (${p.category}, unspecified recency)`;
  }

  return layer("category_usage", label, base, "category_usage", "assumed");
}

function buildFrequencyLayer(p: ParsedCriteria): FunnelLayer | null {
  if (!p.frequency) return null;
  // "Heavy" is already folded into the category layer when recency is tight.
  // We only add an explicit frequency layer if the category layer isn't
  // already the P3M/heavy one.
  const recencyIsTight = p.recency === "P3M" || p.frequency === "heavy";
  if (recencyIsTight) return null;

  const base =
    p.frequency === "heavy"
      ? HEAVY_USER
      : p.frequency === "medium"
      ? MEDIUM_USER
      : LIGHT_USER;
  return layer(
    "frequency",
    `Frequency: ${p.frequency} user`,
    base,
    "behavioural",
    "assumed",
  );
}

function buildBrandLayer(p: ParsedCriteria): FunnelLayer | null {
  const hasOwnership = p.qualifiers.some((q) => q.kind === "ownership");
  if (!hasOwnership && !p.brand_specificity) return null;

  if (p.brand_specificity === "niche_premium") {
    return layer(
      "brand_niche",
      "Brand: niche / premium owner",
      BRAND_NICHE_PREMIUM,
      "brand_ownership",
      "assumed",
    );
  }
  if (p.brand_specificity === "specific_brand") {
    return layer(
      "brand_owner",
      "Brand: specific-brand owner",
      BRAND_SPECIFIC,
      "brand_ownership",
      "assumed",
    );
  }
  if (p.brand_specificity === "category_only" || hasOwnership) {
    return layer(
      "brand_owner",
      "Ownership: any-brand in category",
      BRAND_ANY,
      "brand_ownership",
      "assumed",
    );
  }
  return null;
}

function buildAttitudinalLayer(p: ParsedCriteria): FunnelLayer | null {
  if (p.attitudinal.length === 0) return null;
  // k attitudinal AND'd → multiply, but each one is a broad-ish filter.
  const base = ATTITUDINAL;
  const label = `Attitudinal: ${p.attitudinal
    .slice(0, 2)
    .map((a) => `"${a}"`)
    .join(", ")}${p.attitudinal.length > 2 ? ` +${p.attitudinal.length - 2} more` : ""}`;
  // If more than one attitudinal filter, compound conservatively.
  let combined = base;
  for (let i = 1; i < p.attitudinal.length; i++) {
    combined = multiplyRanges(combined, { low: 0.75, point: 0.85, high: 0.95 });
  }
  return layer("attitudinal", label, combined, "attitudinal", "assumed");
}

function buildConditionLayer(p: ParsedCriteria): FunnelLayer | null {
  const conditions = p.qualifiers.filter((q) => q.kind === "condition");
  if (conditions.length === 0 && !p.clinical) return null;

  const text = conditions.map((c) => c.value).join(" ").toLowerCase();
  let base: Range;
  let tier: string;
  if (/rare|orphan|stage\s*iv|stage\s*4/i.test(text)) {
    base = CONDITION_RARE;
    tier = "rare";
  } else if (
    /diabetes|copd|rheumatoid|cancer|hepatitis|crohn|asthma|migraine/i.test(text)
  ) {
    base = CONDITION_MODERATE;
    tier = "moderate";
  } else {
    base = CONDITION_COMMON;
    tier = "common";
  }

  return layer(
    "condition",
    `Diagnosed condition: ${tier} (${conditions.map((c) => c.value).join("; ") || "clinical screener"})`,
    base,
    "none", // Rule 3 — no panel uplift on clinical
    "prevalence",
    "Published prevalence; no panel uplift (Rule 3).",
  );
}

function buildExclusionLayer(p: ParsedCriteria): FunnelLayer | null {
  if (p.exclusions.length === 0) return null;
  let combined: Range = { low: 1, point: 1, high: 1 };
  for (let i = 0; i < p.exclusions.length; i++) {
    combined = multiplyRanges(combined, EXCLUSION_PER);
  }
  return layer(
    "exclusion",
    `Hard exclusions (×${p.exclusions.length}): ${p.exclusions.slice(0, 2).join(", ")}${p.exclusions.length > 2 ? "…" : ""}`,
    combined,
    "none",
    "assumed",
  );
}

function buildIncomeLayer(p: ParsedCriteria): FunnelLayer | null {
  // Only fire when income is orthogonal to the SES segment.
  if (p.seg && p.seg !== "all") return null;

  const txt = [...p.attitudinal, ...p.qualifiers.map((q) => q.value)]
    .join(" ")
    .toLowerCase();
  if (/hnwi|ultra[- ]?high|\$\s*1m|high[- ]net[- ]worth/.test(txt)) {
    return layer("other", "Income: HNWI", INCOME_HNWI, "none", "assumed");
  }
  if (/top\s*quintile|top\s*10%|top\s*20%|affluent|wealthy/.test(txt)) {
    return layer(
      "other",
      "Income: top quintile",
      INCOME_TOP_QUINTILE,
      "none",
      "assumed",
    );
  }
  return null;
}

// -----------------------------------------------------------------------------
// Main entry
// -----------------------------------------------------------------------------

export function calculate(
  parsed: ParsedCriteria,
  market: string,
  panelType: PanelType,
): CalcResult {
  const cal = getCalibration(market);
  const group = getMarketGroup(market);
  const notes: string[] = [];

  if (!SES_PENETRATION[market]) {
    notes.push(`Unknown market "${market}" — using defaults only.`);
  }

  // --- Build funnel layers in Rule 1 routing order ---
  const layersRaw: Array<FunnelLayer | null> = [
    buildGeoLayer(parsed, cal),
    buildAgeLayer(parsed),
    buildGenderLayer(parsed),
    buildSesLayer(parsed, market, cal),
    buildIncomeLayer(parsed),
    buildCategoryLayer(parsed),
    buildFrequencyLayer(parsed),
    buildBrandLayer(parsed),
    buildAttitudinalLayer(parsed),
    buildConditionLayer(parsed),
    buildExclusionLayer(parsed),
  ];

  let layers = layersRaw.filter((l): l is FunnelLayer => l !== null);

  // Apply behavioural market calibration to uplift-eligible layers.
  if (cal.behaviouralAdjust !== 1) {
    layers = layers.map((l) =>
      l.upliftClass === "none"
        ? l
        : {
            ...l,
            passRate: clampRange(scaleRange(l.passRate, cal.behaviouralAdjust)),
            note: [l.note, `behavioural ×${cal.behaviouralAdjust}`]
              .filter(Boolean)
              .join(" · "),
          },
    );
  }

  // --- Rule 4A: OR-logic union across non-demographic layers ---
  // When logic=OR, we combine the qualifier-type layers (category, brand,
  // behaviour, condition) using the union formula rather than multiplying.
  // Demographic/geo/SES/exclusion layers remain AND-multiplied.
  const orKinds: LayerKind[] = [
    "category_usage",
    "recency",
    "frequency",
    "brand_owner",
    "brand_niche",
    "attitudinal",
    "condition",
  ];
  const isOr = parsed.logic === "OR";

  let multiplicativeLayers: FunnelLayer[] = layers;
  let orBlock: { layers: FunnelLayer[]; combined: Range } | null = null;

  if (isOr) {
    const orLayers = layers.filter((l) => orKinds.includes(l.kind));
    if (orLayers.length >= 2) {
      const combined = unionRanges(orLayers.map((l) => l.passRate));
      orBlock = { layers: orLayers, combined };
      multiplicativeLayers = layers.filter((l) => !orKinds.includes(l.kind));
      notes.push(
        `OR logic: ${orLayers.length} qualifier layers combined via union formula.`,
      );
    }
  }

  // --- Sequential multiplication (from 100% base) ---
  let acc: Range = { low: 1, point: 1, high: 1 };
  for (const l of multiplicativeLayers) {
    acc = multiplyRanges(acc, l.passRate);
  }
  if (orBlock) {
    acc = multiplyRanges(acc, orBlock.combined);
  }

  // --- Rule 3: panel uplift ---
  const classes = layers.map((l) => l.upliftClass);
  const anyClinical = layers.some((l) => l.kind === "condition");
  const { multiplier: upliftRange, reason: upliftReason } = resolveUplift(
    classes,
    panelType,
    anyClinical,
  );
  acc = multiplyRanges(acc, upliftRange);

  // --- Rule 6: range widening ---
  // Widen when many layers are assumed, OR-logic, niche, or no market-specific
  // benchmark exists.
  const assumedCount = layers.filter((l) => l.source === "assumed").length;
  const benchmarkCount = layers.filter((l) => l.source === "benchmark").length;
  const prevalenceCount = layers.filter((l) => l.source === "prevalence").length;

  let widenFactor = cal.rangeWidening;
  if (isOr) widenFactor *= 1.15;
  if (assumedCount >= 3) widenFactor *= 1.15;
  if (layers.length >= 6) widenFactor *= 1.1;
  // Rare population
  if (layers.some((l) => l.level === "VeryNarrow")) widenFactor *= 1.15;

  const widened = widen(acc, widenFactor);
  const finalRange = clampRange(widened);

  // --- Rule 7: verdict ---
  const irLow = finalRange.low * 100;
  const irPoint = finalRange.point * 100;
  const irHigh = finalRange.high * 100;

  let verdict: Verdict;
  if (parsed.assumed_ir == null) {
    verdict = "ACCURATE"; // no basis to disagree; flagged in notes
    notes.push("No assumed IR provided — defaulting to ACCURATE; review manually.");
  } else {
    const a = parsed.assumed_ir;
    if (a > irHigh * 1.08) verdict = "TOO_HIGH";
    else if (a > irHigh) verdict = "BORDERLINE";
    else if (a >= irLow * 0.85) verdict = "ACCURATE";
    else verdict = "TOO_LOW";
  }

  // --- Rule 8: confidence ---
  let confidence: Confidence;
  let confidenceReason: string | null = null;
  const total = layers.length;
  if (total === 0) {
    confidence = "LOW";
    confidenceReason = "No layers detected — screener too thin to model.";
  } else {
    const grounded = benchmarkCount + prevalenceCount;
    const groundedShare = grounded / total;
    if (groundedShare >= 0.7) {
      confidence = "HIGH";
    } else if (groundedShare >= 0.4) {
      confidence = "MEDIUM";
      confidenceReason = `${assumedCount}/${total} layers used Rule 4 conservative defaults.`;
    } else {
      confidence = "LOW";
      confidenceReason = `${assumedCount}/${total} layers used conservative defaults; output is directional.`;
    }
  }

  // --- Short reason (real-world framing per Rule 3 language note) ---
  const shortReason = buildShortReason(parsed, market, irPoint);

  return {
    verdict,
    confidence,
    confidence_reason: confidenceReason,
    ir_low: round(irLow),
    ir_point: round(irPoint),
    ir_high: round(irHigh),
    assumed_ir: parsed.assumed_ir,
    layers,
    panel_uplift: upliftRange.point,
    panel_uplift_reason: upliftReason,
    market_group: group,
    market_calibration: cal,
    short_reason: shortReason,
    notes,
  };
}

function round(n: number): number {
  if (n < 1) return Math.round(n * 100) / 100;
  if (n < 10) return Math.round(n * 10) / 10;
  return Math.round(n);
}

function buildShortReason(
  p: ParsedCriteria,
  market: string,
  irPoint: number,
): string {
  const parts: string[] = [];
  if (p.age_min != null || p.age_max != null) {
    parts.push(
      `adults ${p.age_min ?? "18"}–${p.age_max != null ? p.age_max : "+"}`,
    );
  } else {
    parts.push("adults");
  }
  if (p.gender !== "all") parts.push(p.gender);
  if (p.seg && p.seg !== "all") parts.push(p.seg);
  if (p.geo_restriction.type === "cities" && p.geo_restriction.cities) {
    parts.push(`in ${p.geo_restriction.cities.slice(0, 3).join(", ")}`);
  }
  if (p.qualifiers.length > 0) {
    const q = p.qualifiers[0].value;
    parts.push(`meeting "${q}"`);
  }
  const who = parts.join(", ");
  const pct =
    irPoint < 1 ? irPoint.toFixed(2) : irPoint < 10 ? irPoint.toFixed(1) : irPoint.toFixed(0);
  return `Estimated ${pct}% of ${market} ${who} qualify in the real-world population.`;
}

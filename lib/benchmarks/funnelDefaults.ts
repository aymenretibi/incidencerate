import type { Range, RestrictionLevel } from "./types";

/**
 * Rule 4 conservative defaults for the screening funnel.
 *
 * Each default is a {low, point, high} pass-rate range expressed as a
 * decimal fraction of the PRIOR funnel layer. Apply sequentially, never
 * summing.
 *
 * These are used when no market-specific benchmark is available. The
 * calculator labels any layer built from these defaults as
 * `source: "assumed"` so the confidence flag (Rule 8) can reflect it.
 */

const R = (low: number, point: number, high: number): Range => ({
  low,
  point,
  high,
});

// -----------------------------------------------------------------------------
// Demographics
// -----------------------------------------------------------------------------

/** Broad demographic filter (age band, gender). Rule 4: 35–65%. */
export const DEMO_BROAD: Range = R(0.35, 0.5, 0.65);

/**
 * Age band presets. Shares of adult population in each band — roughly
 * market-invariant (±3 pts). Values anchored to UN median for the 42-market
 * set.
 */
export const AGE_BANDS: Record<string, Range> = {
  all_adults: R(1.0, 1.0, 1.0),
  "18_24": R(0.09, 0.12, 0.15),
  "18_34": R(0.25, 0.3, 0.35),
  "25_54": R(0.46, 0.52, 0.58),
  "35_54": R(0.26, 0.32, 0.38),
  "55_plus": R(0.26, 0.33, 0.4),
  // Narrow custom — a ≤ 6-year span within the adult population.
  narrow_custom: R(0.08, 0.14, 0.2),
};

/** Gender (~50/50 with small skew). */
export const GENDER_RANGE: Range = R(0.48, 0.5, 0.52);

/**
 * Geographic restriction. Rule 4: 10–40% depending on metro vs. national.
 */
export const GEO_BANDS: Record<string, Range> = {
  national: R(1.0, 1.0, 1.0),
  regions_few: R(0.3, 0.45, 0.6),
  cities_4_10: R(0.25, 0.36, 0.48),
  cities_2_3: R(0.13, 0.18, 0.24),
  cities_1: R(0.04, 0.07, 0.11),
};

// -----------------------------------------------------------------------------
// Behavioural / category layers (Rule 4)
// -----------------------------------------------------------------------------

/** Category buyer in past 12 months. Rule 4: 30–65%. */
export const CATEGORY_P12M: Range = R(0.3, 0.48, 0.65);

/** Category buyer in past 3 months. Rule 4: 15–50%. */
export const CATEGORY_P3M: Range = R(0.15, 0.32, 0.5);

/** Ever-category / lifetime. Generously wider. */
export const CATEGORY_EVER: Range = R(0.4, 0.6, 0.8);

/** High-frequency / heavy user. Rule 4: 5–20% of prior layer. */
export const HEAVY_USER: Range = R(0.05, 0.12, 0.2);

/** Medium-frequency user. */
export const MEDIUM_USER: Range = R(0.2, 0.35, 0.5);

/** Light user. */
export const LIGHT_USER: Range = R(0.35, 0.5, 0.65);

/** Specific brand owner. Rule 4: 5–20% of category buyers. */
export const BRAND_SPECIFIC: Range = R(0.05, 0.12, 0.2);

/** Niche / premium brand owner. Rule 4: 1–10% of category buyers. */
export const BRAND_NICHE_PREMIUM: Range = R(0.01, 0.05, 0.1);

/** Any-brand (category-only) passthrough. */
export const BRAND_ANY: Range = R(0.75, 0.88, 1.0);

/** Attitudinal / motivational filter. Rule 4: 20–55%. */
export const ATTITUDINAL: Range = R(0.2, 0.35, 0.55);

/** Hard exclusion — subtract 5–20% from prior layer (i.e. multiply by 0.8–0.95). */
export const EXCLUSION_PER: Range = R(0.8, 0.88, 0.95);

// -----------------------------------------------------------------------------
// Clinical / epidemiological
// -----------------------------------------------------------------------------

/**
 * Clinical condition tiers — based on published prevalence. Rule 3
 * mandates NO panel uplift for these.
 */
export const CONDITION_COMMON: Range = R(0.2, 0.28, 0.36); // hypertension, BMI>25, allergies
export const CONDITION_MODERATE: Range = R(0.05, 0.08, 0.12); // T2D on meds, asthma, migraine
export const CONDITION_RARE: Range = R(0.002, 0.008, 0.02); // oncology, orphan dx

// -----------------------------------------------------------------------------
// Income / SES gates (when not captured by SES_PENETRATION segment)
// -----------------------------------------------------------------------------

export const INCOME_MID_PLUS: Range = R(0.45, 0.55, 0.65);
export const INCOME_TOP_QUINTILE: Range = R(0.17, 0.2, 0.22);
export const INCOME_HNWI: Range = R(0.01, 0.025, 0.04);

// -----------------------------------------------------------------------------
// Restriction-level classification helpers (Rule 2)
// -----------------------------------------------------------------------------

/**
 * Classify a layer by its point pass rate. Mirrors Rule 2's definitions.
 */
export function classifyLevel(pointPassRate: number): RestrictionLevel {
  if (pointPassRate >= 0.5) return "Broad";
  if (pointPassRate >= 0.2) return "Medium";
  if (pointPassRate >= 0.05) return "Narrow";
  return "VeryNarrow";
}

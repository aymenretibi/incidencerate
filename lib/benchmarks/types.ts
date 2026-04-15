/**
 * Types for the IR Modelling rules engine.
 *
 * The calculator runs a sequential screening funnel (Rule 2) from a 100%
 * panel base. Each layer is classified by restriction level (Rule 2) and
 * has a three-point pass-rate range {low, point, high}. Panel uplift
 * (Rule 3) is applied selectively — only to category / behavioural /
 * attitudinal layers, never to clinical prevalence. Market calibration
 * (Rule 5) adjusts group-level assumptions. Output is a triad
 * (IR_low, IR_point, IR_high) plus a verdict (Rule 7) and confidence
 * flag (Rule 8).
 */

export type Market = string;

/** Rule 2 restriction-level classification. */
export type RestrictionLevel = "Broad" | "Medium" | "Narrow" | "VeryNarrow";

/**
 * A pass-rate range expressed as a decimal fraction 0–1 (e.g. 0.35 = 35%).
 * Used both for individual layers and for the IR output triad.
 */
export interface Range {
  low: number;
  point: number;
  high: number;
}

/** Panel-uplift class of a layer (Rule 3). */
export type UpliftClass =
  | "category_usage" // +20–35%
  | "brand_ownership" // +20–35% (same bucket as category usage)
  | "attitudinal" // +15–25%
  | "behavioural" // +15–25%
  | "none"; // geo / SES / age / gender / clinical → no panel uplift

/** One layer in the sequential screening funnel. */
export interface FunnelLayer {
  label: string;
  kind: LayerKind;
  level: RestrictionLevel;
  passRate: Range; // fraction 0–1 of the PRIOR layer's survivors
  upliftClass: UpliftClass;
  source: LayerSource;
  note?: string;
}

export type LayerKind =
  | "demographic_geo"
  | "demographic_age"
  | "demographic_gender"
  | "ses"
  | "category_usage"
  | "recency"
  | "frequency"
  | "brand_owner"
  | "brand_niche"
  | "attitudinal"
  | "condition"
  | "exclusion"
  | "other";

export type LayerSource = "benchmark" | "assumed" | "prevalence";

/** Market calibration groups (Rule 5). */
export type MarketGroup =
  | "anglo_mature"
  | "quality_eu"
  | "latam"
  | "apac_mea"
  | "cee_other";

export interface MarketCalibration {
  /** Multiplier on all category/brand/attitudinal (behavioural) pass rates. */
  behaviouralAdjust: number;
  /** Multiplier on SES pass rates. <1 means more restrictive. */
  sesTighten: number;
  /** Multiplier on geo pass rates. >1 means less restrictive. */
  geoLoosen: number;
  /** Range-widening factor applied to the low/high spread (1.0 = no change). */
  rangeWidening: number;
  /** Human-readable note for UI / debug. */
  note: string;
}

// -----------------------------------------------------------------------------
// Parsed criteria shape — extended from the original schema.
// -----------------------------------------------------------------------------

export type Gender = "male" | "female" | "all";
export type SesTier = "ABC1" | "ABC1C2" | "ABC1C2D" | "all";
export type Category =
  | "financial"
  | "fmcg"
  | "tech"
  | "auto"
  | "healthcare"
  | "other";
export type Recency = "P3M" | "P6M" | "P12M" | "ever" | null;
export type Frequency = "heavy" | "medium" | "light" | null;
export type BrandSpecificity =
  | null
  | "category_only" // any brand in category
  | "specific_brand" // named or demographic-tight brand
  | "niche_premium"; // premium / niche / low-share brand

export type PanelType = "online" | "cati" | "f2f" | "hybrid";

export interface ParsedCriteria {
  market: string | null;
  target_n: number | null;
  assumed_ir: number | null;
  age_min: number | null;
  age_max: number | null;
  gender: Gender;
  seg: SesTier | null;
  category: Category | null;
  geo_restriction: {
    type: "national" | "cities" | "regions";
    cities?: string[];
    count?: number;
  };
  qualifiers: Array<{
    kind: "condition" | "ownership" | "behaviour" | "other";
    value: string;
  }>;
  logic: "AND" | "OR";
  panel_type: PanelType | null;

  // New fields (Rule 2 granularity):
  recency: Recency;
  frequency: Frequency;
  brand_specificity: BrandSpecificity;
  attitudinal: string[];
  exclusions: string[];
  clinical: boolean;

  notes: string;
}

// -----------------------------------------------------------------------------
// Output shape.
// -----------------------------------------------------------------------------

export type Verdict = "TOO_HIGH" | "BORDERLINE" | "ACCURATE" | "TOO_LOW";
export type Confidence = "HIGH" | "MEDIUM" | "LOW";

export interface CalcResult {
  verdict: Verdict;
  confidence: Confidence;
  confidence_reason: string | null;

  /** IR as a percentage (0–100) for UI display. */
  ir_low: number;
  ir_point: number;
  ir_high: number;
  assumed_ir: number | null;

  layers: FunnelLayer[];

  /** Aggregate uplift multiplier actually applied (1.0 = none). */
  panel_uplift: number;
  panel_uplift_reason: string;

  /** Market calibration resolved for the target market. */
  market_group: MarketGroup;
  market_calibration: MarketCalibration;

  short_reason: string;
  notes: string[];
}

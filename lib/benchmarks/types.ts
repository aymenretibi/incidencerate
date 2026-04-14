/**
 * Shared types for the benchmark tables and the parsed screener criteria object.
 *
 * The baseIR / modifiers / panelUplift maps are the *only* place IR numbers live.
 * The calculator is pure multiplication against these constants — the LLM never
 * emits an IR, only a typed criteria object used as an index into these tables.
 */

export type Market = string;

export type Segment =
  | "general_population"
  | "abc1"
  | "abc1c2"
  | "abc1c2d"
  | "women_18_45"
  | "men_25_54"
  | "adults_18_34";

export interface BaseIREntry {
  /** Midpoint / point estimate (percentage, 0–100). */
  point: number;
  /** Conservative lower bound (percentage). */
  floor: number;
}

export type BaseIRTable = Record<Market, Partial<Record<Segment, BaseIREntry>>>;

export interface ModifierRange {
  /** Lower bound of the modifier multiplier (applied in conservative floor calc). */
  min: number;
  /** Upper bound of the modifier multiplier (applied in the optimistic calc). */
  max: number;
}

export interface ModifierTable {
  category: Record<Category, ModifierRange>;
  geo: {
    national: ModifierRange;
    regions_few: ModifierRange;
    cities_1: ModifierRange;
    cities_2_3: ModifierRange;
    cities_4_10: ModifierRange;
  };
  age: Record<AgeBand, ModifierRange>;
  gender: { all: ModifierRange; male: ModifierRange; female: ModifierRange };
  condition: Record<ConditionTier, ModifierRange>;
  income: Record<IncomeTier, ModifierRange>;
}

export type Category =
  | "financial"
  | "fmcg"
  | "tech"
  | "auto"
  | "healthcare"
  | "other";

export type AgeBand =
  | "all_adults"
  | "18_24"
  | "18_34"
  | "25_54"
  | "35_54"
  | "55_plus"
  | "narrow_custom";

export type ConditionTier =
  | "none"
  | "common" // e.g. hypertension
  | "moderate" // e.g. type-2 diabetes diagnosed
  | "rare"; // e.g. rare autoimmune

export type IncomeTier = "all" | "mid_plus" | "top_quintile" | "hnwi";

export type PanelType = "online" | "cati" | "f2f" | "hybrid";
export type ProjectType = "clinical" | "nonclinical";

export type PanelUpliftTable = Record<PanelType, Record<ProjectType, number>>;

/** The Zod-validated object the LLM is required to return. */
export interface ParsedCriteria {
  market: string | null;
  target_n: number | null;
  assumed_ir: number | null;
  age_min: number | null;
  age_max: number | null;
  gender: "male" | "female" | "all";
  seg: "ABC1" | "ABC1C2" | "ABC1C2D" | "all" | null;
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
  notes: string;
}

export interface AppliedModifier {
  label: string;
  range: ModifierRange;
  source: "exact" | "category_default" | "fallback";
}

export type Verdict = "ACCEPT" | "REVIEW" | "REJECT";
export type Confidence = "high" | "medium" | "low";

export interface CalcResult {
  verdict: Verdict;
  confidence: Confidence;
  final_ir: number;
  floor_ir: number;
  assumed_ir: number | null;
  modifiers_applied: AppliedModifier[];
  base_segment: Segment;
  panel_type: PanelType;
  uplift: number;
  risk_flag: boolean;
  notes: string[];
}

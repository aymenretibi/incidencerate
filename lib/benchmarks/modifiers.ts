import type { ModifierTable } from "./types";

/**
 * Criteria modifier table — industry-informed estimates.
 *
 * Each entry is a multiplier range applied to the base IR. The calculator
 * uses the midpoint for the point estimate and the minimum for the
 * conservative floor.
 *
 * Sources: typical category-penetration benchmarks from Kantar / Nielsen /
 * Euromonitor, public syndicated panel distributions, and the spec's own
 * validated ranges (financial 0.35–0.55, FMCG 0.65–0.85, 3-city 0.15–0.20,
 * online non-clinical uplift ~+27.5%).
 *
 * Replace these with your validated numbers when available; shape is fixed.
 */
export const MODIFIERS: ModifierTable = {
  // Category penetration — fraction of target SES/age base who qualify for
  // a typical project in that category. Ranges reflect spread across
  // sub-categories (e.g. financial covers both "has any bank account"
  // [high] and "has invested in mutual funds" [low], so range is wide).
  category: {
    fmcg: { min: 0.65, max: 0.85 }, // everyday repeat-purchase categories
    tech: { min: 0.45, max: 0.7 }, // smartphone, streaming, gaming
    auto: { min: 0.28, max: 0.5 }, // new-car buyers, specific vehicle types
    financial: { min: 0.35, max: 0.55 }, // specific products, not "has an account"
    healthcare: { min: 0.12, max: 0.35 }, // condition- or treatment-gated
    other: { min: 0.5, max: 0.8 }, // unspecified / general consumer
  },

  // Geographic restriction — fraction of national population in covered area.
  // Calibrated against urban-population shares typical for the 42 markets.
  geo: {
    national: { min: 1.0, max: 1.0 },
    regions_few: { min: 0.35, max: 0.55 }, // e.g. "Southeast + Midwest"
    cities_1: { min: 0.05, max: 0.1 }, // capital / single metro
    cities_2_3: { min: 0.15, max: 0.22 }, // common top-3 metro combo
    cities_4_10: { min: 0.28, max: 0.45 },
  },

  // Age bands — share of adult population in the band (UN median for the
  // 42-market set, ±3pts). narrow_custom covers ranges ≤ 6 years wide.
  age: {
    all_adults: { min: 1.0, max: 1.0 },
    "18_24": { min: 0.1, max: 0.14 },
    "18_34": { min: 0.27, max: 0.33 },
    "25_54": { min: 0.48, max: 0.56 },
    "35_54": { min: 0.28, max: 0.35 },
    "55_plus": { min: 0.28, max: 0.38 },
    narrow_custom: { min: 0.1, max: 0.18 },
  },

  // Gender — ~50/50 ± demographic skew.
  gender: {
    all: { min: 1.0, max: 1.0 },
    male: { min: 0.48, max: 0.52 },
    female: { min: 0.48, max: 0.52 },
  },

  // Medical conditions — prevalence-driven.
  // common: hypertension, BMI>25, seasonal allergies, acid reflux.
  // moderate: diagnosed T2D on meds, asthma, migraines, Crohn's.
  // rare: specific stage oncology, orphan autoimmune, specialist-only dx.
  condition: {
    none: { min: 1.0, max: 1.0 },
    common: { min: 0.2, max: 0.35 },
    moderate: { min: 0.05, max: 0.12 },
    rare: { min: 0.002, max: 0.02 },
  },

  // Income / affluence gates.
  income: {
    all: { min: 1.0, max: 1.0 },
    // "above median" — middle/upper-middle income earners.
    mid_plus: { min: 0.5, max: 0.65 },
    // literal top-20% of earners; ~20% by definition, ±buffer for panel
    // under-representation.
    top_quintile: { min: 0.18, max: 0.22 },
    // High Net Worth Individuals (≥ USD 1M investable assets).
    hnwi: { min: 0.015, max: 0.04 },
  },
};

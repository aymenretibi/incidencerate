import type { ModifierTable } from "./types";

/**
 * Criteria modifier table. Each entry is a multiplier range; the calculator
 * uses the midpoint for the point estimate and the min for the conservative
 * floor.
 *
 * TODO(USER): replace placeholder ranges with validated numbers from prior
 * IR research. Shape is fixed — values are illustrative starters drawn from
 * the spec.
 */
export const MODIFIERS: ModifierTable = {
  category: {
    financial: { min: 0.35, max: 0.55 },
    fmcg: { min: 0.65, max: 0.85 },
    tech: { min: 0.45, max: 0.7 },
    auto: { min: 0.3, max: 0.55 },
    healthcare: { min: 0.15, max: 0.4 },
    other: { min: 0.5, max: 0.8 },
  },
  geo: {
    national: { min: 1.0, max: 1.0 },
    regions_few: { min: 0.4, max: 0.6 },
    cities_1: { min: 0.06, max: 0.1 },
    cities_2_3: { min: 0.15, max: 0.2 },
    cities_4_10: { min: 0.3, max: 0.45 },
  },
  age: {
    all_adults: { min: 1.0, max: 1.0 },
    "18_24": { min: 0.1, max: 0.14 },
    "18_34": { min: 0.25, max: 0.32 },
    "25_54": { min: 0.48, max: 0.55 },
    "35_54": { min: 0.3, max: 0.38 },
    "55_plus": { min: 0.28, max: 0.35 },
    narrow_custom: { min: 0.12, max: 0.22 },
  },
  gender: {
    all: { min: 1.0, max: 1.0 },
    male: { min: 0.48, max: 0.52 },
    female: { min: 0.48, max: 0.52 },
  },
  condition: {
    none: { min: 1.0, max: 1.0 },
    common: { min: 0.2, max: 0.35 },
    moderate: { min: 0.05, max: 0.12 },
    rare: { min: 0.005, max: 0.02 },
  },
  income: {
    all: { min: 1.0, max: 1.0 },
    mid_plus: { min: 0.55, max: 0.7 },
    top_quintile: { min: 0.18, max: 0.22 },
    hnwi: { min: 0.02, max: 0.05 },
  },
};

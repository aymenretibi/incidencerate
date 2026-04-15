import type { Market, Range } from "./types";

/**
 * SES penetration table — fraction of the adult population in each SES
 * tier, per market, expressed as a three-point range {low, point, high}.
 *
 * Used as one layer in the screening funnel (Rule 2) — not as a "base IR"
 * in the old multiplicative sense. The funnel always starts at 100% panel
 * base and applies SES sequentially.
 *
 * Values are industry-informed estimates tiered by market development:
 *   T1 — highly developed (US, DE, JP, UK, SG, HK, Nordics)
 *   T2 — developed / upper-middle (S/S-E EU, UAE, SA, MY, CL, AR)
 *   T3 — emerging middle-income (BR, MX, CN, TR, CO, TH, ZA)
 *   T4 — lower-income emerging (IN, NG, EG, PH, ID, VN, MA, PE)
 *
 * Sources: Eurostat income deciles, Pew SES bands, World Bank middle-class,
 * market-specific syndicated SES distributions. Replace with validated
 * dataset for production.
 */

type Tier = "abc1" | "abc1c2" | "abc1c2d";

const R = (low: number, point: number, high: number): Range => ({
  low,
  point,
  high,
});

type TierRow = Record<Tier, Range>;

// Per-tier templates (pass rates as decimals 0–1).
const T1: TierRow = {
  abc1: R(0.36, 0.42, 0.48),
  abc1c2: R(0.66, 0.72, 0.78),
  abc1c2d: R(0.9, 0.93, 0.96),
};
const T2: TierRow = {
  abc1: R(0.26, 0.32, 0.38),
  abc1c2: R(0.58, 0.64, 0.7),
  abc1c2d: R(0.84, 0.88, 0.92),
};
const T3: TierRow = {
  abc1: R(0.16, 0.2, 0.24),
  abc1c2: R(0.48, 0.54, 0.6),
  abc1c2d: R(0.74, 0.8, 0.86),
};
const T4: TierRow = {
  abc1: R(0.08, 0.12, 0.16),
  abc1c2: R(0.32, 0.38, 0.44),
  abc1c2d: R(0.6, 0.68, 0.76),
};

function merge(base: TierRow, overrides: Partial<TierRow>): TierRow {
  return { ...base, ...overrides };
}

export const SES_PENETRATION: Record<Market, TierRow> = {
  // --- Tier 1 ---
  USA: merge(T1, { abc1: R(0.4, 0.45, 0.5), abc1c2: R(0.68, 0.74, 0.8) }),
  Canada: T1,
  UK: T1,
  Germany: T1,
  France: merge(T1, { abc1: R(0.34, 0.4, 0.46) }),
  Japan: T1,
  "South Korea": T1,
  Australia: T1,
  Netherlands: T1,
  Switzerland: merge(T1, { abc1: R(0.42, 0.48, 0.54), abc1c2: R(0.7, 0.75, 0.8) }),
  Sweden: merge(T1, { abc1: R(0.4, 0.46, 0.52) }),
  Norway: merge(T1, { abc1: R(0.4, 0.46, 0.52) }),
  Denmark: T1,
  Finland: merge(T1, { abc1: R(0.38, 0.44, 0.5) }),
  Austria: T1,
  Belgium: T1,
  Ireland: T1,
  Singapore: T1,
  "Hong Kong": merge(T1, { abc1: R(0.3, 0.36, 0.42), abc1c2: R(0.6, 0.66, 0.72) }),

  // --- Tier 2 ---
  Italy: merge(T2, { abc1: R(0.3, 0.36, 0.42), abc1c2: R(0.6, 0.66, 0.72) }),
  Spain: merge(T2, { abc1: R(0.28, 0.34, 0.4) }),
  Portugal: T2,
  "Czech Republic": T2,
  Greece: merge(T2, { abc1: R(0.22, 0.28, 0.34) }),
  Hungary: merge(T2, { abc1: R(0.24, 0.3, 0.36) }),
  Poland: T2,
  Chile: merge(T2, { abc1: R(0.16, 0.22, 0.28), abc1c2: R(0.46, 0.52, 0.58) }),
  Argentina: merge(T2, { abc1: R(0.14, 0.2, 0.26), abc1c2: R(0.49, 0.55, 0.61) }),
  UAE: merge(T2, { abc1: R(0.26, 0.32, 0.38) }),
  "Saudi Arabia": merge(T2, { abc1: R(0.22, 0.28, 0.34) }),
  Malaysia: merge(T2, { abc1: R(0.22, 0.28, 0.34) }),

  // --- Tier 3 ---
  Brazil: merge(T3, { abc1: R(0.18, 0.22, 0.26), abc1c2: R(0.52, 0.58, 0.64) }),
  Mexico: T3,
  Colombia: merge(T3, { abc1: R(0.14, 0.18, 0.22) }),
  Turkey: merge(T3, { abc1: R(0.18, 0.22, 0.26) }),
  Thailand: merge(T3, { abc1: R(0.18, 0.22, 0.26) }),
  Ukraine: merge(T3, { abc1: R(0.14, 0.18, 0.22) }),
  Romania: merge(T3, { abc1: R(0.14, 0.18, 0.22) }),
  "South Africa": merge(T3, {
    abc1: R(0.14, 0.18, 0.22),
    abc1c2: R(0.39, 0.45, 0.51),
    abc1c2d: R(0.64, 0.7, 0.76),
  }),
  China: merge(T3, { abc1: R(0.2, 0.24, 0.28) }),

  // --- Tier 4 ---
  Peru: T4,
  India: merge(T4, { abc1: R(0.06, 0.1, 0.14), abc1c2: R(0.28, 0.34, 0.4) }),
  Indonesia: T4,
  Philippines: T4,
  Vietnam: merge(T4, { abc1: R(0.12, 0.16, 0.2) }),
  Egypt: T4,
  Morocco: T4,
  Nigeria: merge(T4, {
    abc1: R(0.04, 0.08, 0.12),
    abc1c2: R(0.24, 0.3, 0.36),
    abc1c2d: R(0.52, 0.58, 0.64),
  }),
};

export const MARKETS: string[] = Object.keys(SES_PENETRATION).sort();

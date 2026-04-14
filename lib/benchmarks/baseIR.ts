import type { BaseIRTable, BaseIREntry, Segment } from "./types";

/**
 * Base IR table — 42 markets × 7 segments.
 *
 * Values below are **industry-informed estimates** calibrated against public
 * sources (Eurostat income deciles, Pew Research SES bands, World Bank
 * middle-class data, UN demographics, IPSOS/Kantar panel distributions).
 * They are good enough for a working prototype but should be replaced with
 * your validated dataset for production use. See README.md.
 *
 * Tiering rationale:
 *   T1 — highly developed, high income (e.g. USA, Germany, Japan, AU, HK-SG).
 *        ABC1 penetration ≈ 40–46%, ABC1C2 ≈ 70–75%.
 *   T2 — developed/upper-middle (e.g. Spain, Italy, Poland, UAE, SA).
 *        ABC1 ≈ 28–36%, ABC1C2 ≈ 60–68%.
 *   T3 — emerging middle-income (e.g. Brazil, Mexico, China, Turkey).
 *        ABC1 ≈ 18–25%, ABC1C2 ≈ 48–58%.
 *   T4 — lower-income emerging (e.g. India, Nigeria, Egypt, Philippines).
 *        ABC1 ≈ 8–16%, ABC1C2 ≈ 32–45%.
 *
 * Demographic rails (fairly market-invariant):
 *   women_18–45 ≈ 22–29% of total adults (higher in younger markets)
 *   men_25–54   ≈ 21–25%
 *   adults_18–34 ≈ 22–35% (higher in emerging markets with younger pyramid)
 *
 * Floors are set conservatively at ~80% of point, widening for low-base
 * segments (abc1 in T4 markets) where panel noise is larger in absolute
 * terms.
 */

// Helper — encodes "conservative floor = 80% of point, widened for low bases"
function e(point: number, floorPct = 0.8): BaseIREntry {
  return { point, floor: Math.max(1, Math.round(point * floorPct)) };
}

// Per-tier templates. Per-market rows override specific cells where useful.
type SegRow = Partial<Record<Segment, BaseIREntry>>;

const TIER1: SegRow = {
  general_population: e(100, 0.95),
  abc1: e(42, 0.8),
  abc1c2: e(72, 0.85),
  abc1c2d: e(93, 0.92),
  women_18_45: e(24, 0.8),
  men_25_54: e(24, 0.8),
  adults_18_34: e(23, 0.8),
};

const TIER2: SegRow = {
  general_population: e(100, 0.95),
  abc1: e(32, 0.78),
  abc1c2: e(64, 0.83),
  abc1c2d: e(88, 0.9),
  women_18_45: e(25, 0.8),
  men_25_54: e(24, 0.8),
  adults_18_34: e(25, 0.8),
};

const TIER3: SegRow = {
  general_population: e(100, 0.95),
  abc1: e(20, 0.75),
  abc1c2: e(54, 0.82),
  abc1c2d: e(80, 0.88),
  women_18_45: e(27, 0.82),
  men_25_54: e(23, 0.8),
  adults_18_34: e(30, 0.83),
};

const TIER4: SegRow = {
  general_population: e(100, 0.95),
  abc1: e(12, 0.7),
  abc1c2: e(38, 0.78),
  abc1c2d: e(68, 0.85),
  women_18_45: e(29, 0.82),
  men_25_54: e(22, 0.8),
  adults_18_34: e(34, 0.85),
};

function merge(base: SegRow, overrides: SegRow): SegRow {
  return { ...base, ...overrides };
}

/**
 * Per-market overrides (where a market deviates from its tier template for a
 * specific demographic reason). Everything unlisted uses the tier defaults.
 */
export const BASE_IR: BaseIRTable = {
  // --- Tier 1: highly developed ---
  USA: merge(TIER1, { abc1: e(45, 0.82), abc1c2: e(74, 0.86) }),
  Canada: TIER1,
  UK: TIER1,
  Germany: TIER1,
  France: merge(TIER1, { abc1: e(40, 0.8) }),
  Japan: merge(TIER1, {
    // Older population pyramid — fewer 18-34, more 55+.
    adults_18_34: e(18, 0.78),
    women_18_45: e(20, 0.78),
  }),
  "South Korea": merge(TIER1, { adults_18_34: e(20, 0.78) }),
  Australia: TIER1,
  Netherlands: TIER1,
  Switzerland: merge(TIER1, { abc1: e(48, 0.82), abc1c2: e(75, 0.86) }),
  Sweden: merge(TIER1, { abc1: e(46, 0.82) }),
  Norway: merge(TIER1, { abc1: e(46, 0.82) }),
  Denmark: merge(TIER1, { abc1: e(45, 0.82) }),
  Finland: merge(TIER1, { abc1: e(44, 0.82) }),
  Austria: TIER1,
  Belgium: TIER1,
  Ireland: TIER1,
  Singapore: TIER1,
  "Hong Kong": merge(TIER1, { abc1: e(36, 0.8), abc1c2: e(66, 0.85) }),

  // --- Tier 2: developed middle / upper-middle ---
  Italy: merge(TIER2, { abc1: e(36, 0.8), abc1c2: e(66, 0.85) }),
  Spain: merge(TIER2, { abc1: e(34, 0.78) }),
  Portugal: TIER2,
  "Czech Republic": TIER2,
  Greece: merge(TIER2, { abc1: e(28, 0.77) }),
  Hungary: merge(TIER2, { abc1: e(30, 0.77) }),
  Poland: merge(TIER2, { abc1: e(32, 0.78) }),
  Chile: merge(TIER2, { abc1: e(22, 0.75), abc1c2: e(52, 0.82) }),
  Argentina: merge(TIER2, {
    abc1: e(20, 0.75),
    abc1c2: e(55, 0.82),
    adults_18_34: e(28, 0.82),
  }),
  UAE: merge(TIER2, { abc1: e(32, 0.78), abc1c2: e(62, 0.83) }),
  "Saudi Arabia": merge(TIER2, { abc1: e(28, 0.77), abc1c2: e(60, 0.83) }),
  Malaysia: merge(TIER2, {
    abc1: e(28, 0.77),
    abc1c2: e(58, 0.83),
    adults_18_34: e(28, 0.82),
  }),

  // --- Tier 3: emerging middle-income ---
  Brazil: merge(TIER3, { abc1: e(22, 0.77), abc1c2: e(58, 0.83) }),
  Mexico: TIER3,
  Colombia: merge(TIER3, { abc1: e(18, 0.75), abc1c2: e(50, 0.8) }),
  Turkey: merge(TIER3, { abc1: e(22, 0.77), abc1c2: e(54, 0.82) }),
  Thailand: merge(TIER3, {
    abc1: e(22, 0.77),
    abc1c2: e(54, 0.82),
    // Aging faster than peers
    adults_18_34: e(26, 0.82),
  }),
  Ukraine: merge(TIER3, { abc1: e(18, 0.75), abc1c2: e(50, 0.8) }),
  Romania: merge(TIER3, { abc1: e(18, 0.75), abc1c2: e(48, 0.8) }),
  "South Africa": merge(TIER3, {
    abc1: e(18, 0.75),
    abc1c2: e(45, 0.8),
    abc1c2d: e(70, 0.85),
  }),
  China: merge(TIER3, {
    abc1: e(24, 0.77),
    abc1c2: e(56, 0.83),
    adults_18_34: e(24, 0.8),
  }),

  // --- Tier 4: lower-income emerging ---
  Peru: merge(TIER4, { abc1: e(14, 0.72) }),
  India: merge(TIER4, { abc1: e(10, 0.68), abc1c2: e(34, 0.75) }),
  Indonesia: merge(TIER4, { abc1: e(13, 0.72) }),
  Philippines: merge(TIER4, { abc1: e(12, 0.7) }),
  Vietnam: merge(TIER4, { abc1: e(16, 0.73), abc1c2: e(44, 0.8) }),
  Egypt: merge(TIER4, { abc1: e(12, 0.7) }),
  Morocco: merge(TIER4, { abc1: e(14, 0.72) }),
  Nigeria: merge(TIER4, {
    abc1: e(8, 0.65),
    abc1c2: e(30, 0.72),
    abc1c2d: e(58, 0.82),
    // Very young pyramid
    adults_18_34: e(38, 0.85),
  }),
};

export const MARKETS: string[] = Object.keys(BASE_IR).sort();

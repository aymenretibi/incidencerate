import type { MarketCalibration, MarketGroup } from "./types";

/**
 * Rule 5 — Market Calibration.
 *
 * Each market is assigned to one of five groups. The group carries a small
 * set of directional adjustments the calculator applies at funnel time.
 *
 * Groups:
 *   anglo_mature  — UK/US/AU/CA/IE: large mature panels, no adjustment.
 *   quality_eu    — DE/FR/Nordics/NL/CH/Benelux/Southern EU: -10–15% on
 *                   behavioural (category/attitudinal) pass rates; panels
 *                   skew toward quality-focused respondents.
 *   latam         — Brazil/Mexico/LatAm: SES filters more restrictive
 *                   (SES ×0.9), geo filters less so (×1.1) because the
 *                   top cities concentrate higher-SES populations.
 *   apac_mea      — SEA/APAC/MEA: panel composition less predictable;
 *                   wider ranges (range widening ×1.25).
 *   cee_other    — Central & Eastern Europe and other markets: defaults
 *                   with minor range widening.
 */
export const MARKET_GROUP: Record<string, MarketGroup> = {
  // anglo_mature
  USA: "anglo_mature",
  UK: "anglo_mature",
  Canada: "anglo_mature",
  Australia: "anglo_mature",
  Ireland: "anglo_mature",

  // quality_eu
  Germany: "quality_eu",
  France: "quality_eu",
  Netherlands: "quality_eu",
  Sweden: "quality_eu",
  Norway: "quality_eu",
  Denmark: "quality_eu",
  Finland: "quality_eu",
  Austria: "quality_eu",
  Belgium: "quality_eu",
  Switzerland: "quality_eu",
  Italy: "quality_eu",
  Spain: "quality_eu",
  Portugal: "quality_eu",
  Greece: "quality_eu",

  // latam
  Brazil: "latam",
  Mexico: "latam",
  Argentina: "latam",
  Chile: "latam",
  Colombia: "latam",
  Peru: "latam",

  // apac_mea
  Japan: "apac_mea",
  "South Korea": "apac_mea",
  Singapore: "apac_mea",
  "Hong Kong": "apac_mea",
  China: "apac_mea",
  Malaysia: "apac_mea",
  Thailand: "apac_mea",
  Vietnam: "apac_mea",
  Indonesia: "apac_mea",
  Philippines: "apac_mea",
  India: "apac_mea",
  UAE: "apac_mea",
  "Saudi Arabia": "apac_mea",
  "South Africa": "apac_mea",
  Egypt: "apac_mea",
  Morocco: "apac_mea",
  Nigeria: "apac_mea",
  Turkey: "apac_mea",

  // cee_other
  Poland: "cee_other",
  "Czech Republic": "cee_other",
  Hungary: "cee_other",
  Romania: "cee_other",
  Ukraine: "cee_other",
};

export const CALIBRATION: Record<MarketGroup, MarketCalibration> = {
  anglo_mature: {
    behaviouralAdjust: 1.0,
    sesTighten: 1.0,
    geoLoosen: 1.0,
    rangeWidening: 1.0,
    note: "Mature anglo panel — Rule 5 defaults used as-is.",
  },
  quality_eu: {
    behaviouralAdjust: 0.875, // -12.5%
    sesTighten: 1.0,
    geoLoosen: 1.0,
    rangeWidening: 1.05,
    note: "Quality-focused EU panel — behavioural pass rates pulled down ~12%.",
  },
  latam: {
    behaviouralAdjust: 1.0,
    sesTighten: 0.9, // SES filters more restrictive
    geoLoosen: 1.1, // geo filters less restrictive (ABC1C2 skews urban)
    rangeWidening: 1.1,
    note: "LatAm — SES tighter, geo filters looser (urban SES concentration).",
  },
  apac_mea: {
    behaviouralAdjust: 1.0,
    sesTighten: 1.0,
    geoLoosen: 1.0,
    rangeWidening: 1.25,
    note: "APAC/MEA — panel composition variable; ranges widened.",
  },
  cee_other: {
    behaviouralAdjust: 0.95,
    sesTighten: 1.0,
    geoLoosen: 1.0,
    rangeWidening: 1.1,
    note: "CEE / other — mild widening; quality-panel conventions.",
  },
};

export function getMarketGroup(market: string): MarketGroup {
  return MARKET_GROUP[market] ?? "cee_other";
}

export function getCalibration(market: string): MarketCalibration {
  return CALIBRATION[getMarketGroup(market)];
}

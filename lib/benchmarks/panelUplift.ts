import type { PanelType, Range, UpliftClass } from "./types";

/**
 * Rule 3 — Panel Self-Selection Adjustment.
 *
 * Online panels skew toward engaged, category-aware adults. We apply an
 * upward uplift only to layers whose class is `category_usage`,
 * `brand_ownership`, `attitudinal` or `behavioural`. Clinical prevalence,
 * geo, SES and demographic layers receive NO uplift (Rule 3 explicit).
 *
 * The ruleset gives these bands vs. true-population base:
 *   Category usage / brand ownership — +20–35%  (multiplier 1.20–1.35)
 *   General behavioural / attitudinal — +15–25% (multiplier 1.15–1.25)
 *   Diagnosed health / geo / SES     — 0%
 *
 * The calculator computes an aggregate uplift: we pick the MAX uplift class
 * present in the funnel and apply it once to the cumulative pass-rate at
 * the end. (Compounding would be too aggressive; Rule 3 describes it as a
 * correction applied "for behavioural/attitudinal criteria", not per-layer
 * compounding.)
 *
 * `panelAttenuation` handles non-online modes: CATI and F2F sample more
 * representatively, so the effective uplift shrinks toward 1.0.
 */

const R = (low: number, point: number, high: number): Range => ({
  low,
  point,
  high,
});

/** Base uplift multipliers for ONLINE panels, by layer class. */
export const UPLIFT_BASE: Record<UpliftClass, Range> = {
  category_usage: R(1.2, 1.275, 1.35),
  brand_ownership: R(1.2, 1.275, 1.35),
  attitudinal: R(1.15, 1.2, 1.25),
  behavioural: R(1.15, 1.2, 1.25),
  none: R(1.0, 1.0, 1.0),
};

/**
 * Per panel type, how much of the online uplift to apply. CATI / F2F sample
 * more representatively → uplift shrinks toward 1.0.
 *
 *   multiplier(panelType, rangeKey) — fraction in [0, 1] of (uplift - 1.0)
 *   retained. 1.0 = full online uplift; 0.0 = no uplift.
 */
export const PANEL_ATTENUATION: Record<PanelType, number> = {
  online: 1.0,
  cati: 0.3, // ~30% of online uplift still needed
  f2f: 0.1, // minimal — face-to-face is most representative
  hybrid: 0.7,
};

/**
 * Compute the uplift multiplier to apply to a final IR, given the layer
 * classes present in the funnel and the panel type.
 *
 * Rule 3 explicitly says clinical work receives no uplift — we enforce
 * that by returning 1.0 if `anyClinical` is true, regardless of what
 * category/behavioural layers are also present (clinical panels pre-screen
 * the frame so over-indexing disappears).
 */
export function resolveUplift(
  classes: UpliftClass[],
  panelType: PanelType,
  anyClinical: boolean,
): { multiplier: Range; reason: string } {
  if (anyClinical) {
    return {
      multiplier: R(1.0, 1.0, 1.0),
      reason:
        "Clinical screener — published prevalence used directly; no panel uplift applied.",
    };
  }

  const present = classes.filter((c) => c !== "none");
  if (present.length === 0) {
    return {
      multiplier: R(1.0, 1.0, 1.0),
      reason: "No behavioural or attitudinal layers — no panel uplift needed.",
    };
  }

  // Pick the strongest uplift class present in the funnel.
  const priority = [
    "category_usage",
    "brand_ownership",
    "attitudinal",
    "behavioural",
  ] as const;
  const picked: Exclude<UpliftClass, "none"> =
    priority.find((p) => present.includes(p)) ?? "behavioural";

  const base = UPLIFT_BASE[picked];
  const attenuation = PANEL_ATTENUATION[panelType];
  // Attenuated uplift = 1.0 + attenuation × (base - 1.0)
  const attenuate = (v: number) => 1 + attenuation * (v - 1);

  const attenuatedReason =
    attenuation < 1
      ? ` (${panelType} panel — uplift attenuated to ${Math.round(attenuation * 100)}% of online baseline)`
      : "";

  return {
    multiplier: {
      low: attenuate(base.low),
      point: attenuate(base.point),
      high: attenuate(base.high),
    },
    reason: `Panel uplift class: ${picked.replace(/_/g, " ")}${attenuatedReason}.`,
  };
}

import type { PanelUpliftTable } from "./types";

/**
 * Panel uplift correction factors — industry-informed estimates.
 *
 * Online panels systematically under-report true-population IR by ~20–35%
 * on non-clinical projects because of self-selection (respondents are more
 * engaged, more digital, and skew ABC1 relative to the general population).
 * The spec and validation work converged on ~+27.5% as the median uplift
 * for online non-clinical — used here as the point factor (1.275).
 *
 * Clinical uplifts are smaller because patients already self-select onto
 * health-specialised panels, and the sampling frame is closer to the true
 * patient population for the condition of interest.
 *
 * CATI and face-to-face sample more representatively and need little to no
 * correction. Hybrid (mixed modes) sits in between.
 */
export const PANEL_UPLIFT: PanelUpliftTable = {
  online: {
    nonclinical: 1.275,
    clinical: 1.08,
  },
  cati: {
    nonclinical: 1.05,
    clinical: 1.02,
  },
  f2f: {
    nonclinical: 1.0,
    clinical: 0.98,
  },
  hybrid: {
    nonclinical: 1.15,
    clinical: 1.05,
  },
};

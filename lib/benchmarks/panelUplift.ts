import type { PanelUpliftTable } from "./types";

/**
 * Panel uplift correction factors. These correct for the systematic downward
 * bias on online panels (self-selection) relative to true population IR.
 *
 * TODO(USER): replace with validated values. Shape is fixed — values are
 * illustrative starters (online non-clinical ≈ +27.5%, per spec).
 */
export const PANEL_UPLIFT: PanelUpliftTable = {
  online: { clinical: 1.05, nonclinical: 1.275 },
  cati: { clinical: 1.0, nonclinical: 1.05 },
  f2f: { clinical: 0.95, nonclinical: 1.0 },
  hybrid: { clinical: 1.0, nonclinical: 1.15 },
};

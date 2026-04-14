import { z } from "zod";

export const ParsedCriteriaSchema = z.object({
  market: z.string().nullable(),
  target_n: z.number().int().positive().nullable(),
  assumed_ir: z.number().min(0).max(100).nullable(),
  age_min: z.number().int().min(0).max(120).nullable(),
  age_max: z.number().int().min(0).max(120).nullable(),
  gender: z.enum(["male", "female", "all"]),
  seg: z.enum(["ABC1", "ABC1C2", "ABC1C2D", "all"]).nullable(),
  category: z
    .enum(["financial", "fmcg", "tech", "auto", "healthcare", "other"])
    .nullable(),
  geo_restriction: z.object({
    type: z.enum(["national", "cities", "regions"]),
    cities: z.array(z.string()).optional(),
    count: z.number().int().min(0).optional(),
  }),
  qualifiers: z.array(
    z.object({
      kind: z.enum(["condition", "ownership", "behaviour", "other"]),
      value: z.string(),
    }),
  ),
  logic: z.enum(["AND", "OR"]),
  panel_type: z.enum(["online", "cati", "f2f", "hybrid"]).nullable(),
  notes: z.string(),
});

export type ParsedCriteriaT = z.infer<typeof ParsedCriteriaSchema>;

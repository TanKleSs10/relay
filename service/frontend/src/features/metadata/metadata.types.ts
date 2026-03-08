import type { z } from "zod";
import { z as zod } from "zod";

export const EnumIndexSchema = zod.object({
  enums: zod.record(zod.string(), zod.array(zod.string())).optional(),
});

export type EnumIndex = z.infer<typeof EnumIndexSchema>;

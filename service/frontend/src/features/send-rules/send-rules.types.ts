import type { z } from "zod";
import { SendRulesSchema } from "../../schemas";

export type SendRules = z.infer<typeof SendRulesSchema>;

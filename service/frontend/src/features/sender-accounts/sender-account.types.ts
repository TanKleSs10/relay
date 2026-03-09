import type { z } from "zod";
import { SenderAccountSchema } from "../../schemas";

export type SenderAccount = z.infer<typeof SenderAccountSchema>;

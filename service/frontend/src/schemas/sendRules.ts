import { z } from "zod";

export const SendRulesSchema = z.object({
  id: z.number().int(),
  messages_per_minute: z.number().int(),
  delay_between_messages: z.number(),
  active_senders: z.number().int(),
  queue_size: z.number().int(),
  calculated_at: z.string().datetime().nullable().optional(),
});

export type SendRules = z.infer<typeof SendRulesSchema>;

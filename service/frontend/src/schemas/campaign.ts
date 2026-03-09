import { z } from "zod";
import { MessageSchema } from "./message";

export const CampaignStatusSchema = z.enum(["CREATED", "ACTIVE", "PAUSED", "FINISHED"]);

export const CampaignSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  status: CampaignStatusSchema,
  messages: z.array(MessageSchema).default([]),
  created_at: z.string().datetime().nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
  finished_at: z.string().datetime().nullable().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema>;

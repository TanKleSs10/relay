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

export const CampaignMetricsSchema = z.object({
  campaign_id: z.number().int(),
  total: z.number().int().nonnegative(),
  sent: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  processing: z.number().int().nonnegative(),
  no_wa: z.number().int().nonnegative(),
  effectiveness: z.number().min(0).max(1),
});

export type CampaignMetrics = z.infer<typeof CampaignMetricsSchema>;

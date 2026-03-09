import type { z } from "zod";
import { CampaignSchema } from "../../schemas";

export type Campaign = z.infer<typeof CampaignSchema>;

export type CampaignUploadSummary = {
  campaign: Campaign;
  created_messages: number;
  invalid_rows?: Array<{ row: number; data: Record<string, string> }>;
};

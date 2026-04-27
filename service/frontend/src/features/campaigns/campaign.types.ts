import type { z } from "zod";
import { CampaignMetricsSchema, CampaignSchema } from "../../schemas";

export type Campaign = z.infer<typeof CampaignSchema>;

export type CampaignMediaAsset = {
  id: string;
  campaign_id: string;
  media_asset_id: string;
  sort_order: number;
  created_at: string;
  media_asset: {
    id: string;
    provider: string;
    resource_type: string;
    public_id: string;
    secure_url: string;
    bytes: number;
    format: string;
    width?: number | null;
    height?: number | null;
    original_filename?: string | null;
    deleted_at?: string | null;
    created_at: string;
    updated_at: string;
  };
};

export type CampaignUploadSummary = {
  campaign: Campaign;
  created_messages: number;
  invalid_rows?: Array<{ row: number; data: Record<string, string> }>;
};

export type CampaignMetrics = z.infer<typeof CampaignMetricsSchema>;

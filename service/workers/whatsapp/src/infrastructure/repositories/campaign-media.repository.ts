import type { Pool } from "pg";

import type { OutboundMedia } from "../../domain/interfaces/message-provider.interface.js";

export class CampaignMediaRepository {
  constructor(private pool: Pool) {}

  async listByCampaign(campaignId: string): Promise<OutboundMedia[]> {
    const result = await this.pool.query<OutboundMedia>(
      `SELECT ma.secure_url AS url, ma.original_filename AS filename
       FROM campaign_media_assets cma
       INNER JOIN media_assets ma
         ON ma.id = cma.media_asset_id
       WHERE cma.campaign_id = $1
         AND ma.deleted_at IS NULL
       ORDER BY cma.sort_order ASC, cma.created_at ASC`,
      [campaignId]
    );
    return result.rows;
  }
}

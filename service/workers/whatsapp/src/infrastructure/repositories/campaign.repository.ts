import type { Pool } from "pg";

import { CampaignStatus } from "../../domain/enums/index.js";

export class CampaignRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async getActiveCampaignId(): Promise<string | null> {
    const result = await this.pool.query<{ id: string }>(
      "SELECT id FROM campaigns WHERE status = $1 ORDER BY id DESC LIMIT 1",
      [CampaignStatus.ACTIVE]
    );
    return result.rows[0]?.id ?? null;
  }

  async markDone(campaignId: string): Promise<void> {
    await this.pool.query(
      "UPDATE campaigns SET status = $2, finished_at = NOW() WHERE id = $1",
      [campaignId, CampaignStatus.FINISHED]
    );
  }

  async markPaused(campaignId: string): Promise<void> {
    await this.pool.query(
      "UPDATE campaigns SET status = $2 WHERE id = $1",
      [campaignId, CampaignStatus.PAUSED]
    );
  }
}

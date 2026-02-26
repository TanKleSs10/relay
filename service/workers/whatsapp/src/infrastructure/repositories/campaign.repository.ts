import type { Pool } from "pg";

import { CampaignStatus } from "../../domain/enums";

export class CampaignRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async markDone(campaignId: number): Promise<void> {
    await this.pool.query(
      "UPDATE campaigns SET status = $2 WHERE id = $1",
      [campaignId, CampaignStatus.DONE]
    );
  }

  async markFailed(campaignId: number): Promise<void> {
    await this.pool.query(
      "UPDATE campaigns SET status = $2 WHERE id = $1",
      [campaignId, CampaignStatus.FAILED]
    );
  }
}

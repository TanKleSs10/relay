import type { Pool } from "pg";

import { MessageStatus } from "../../domain/enums";

export type MessageRow = {
  id: number;
  campaign_id: number;
  recipient: string;
  payload: string;
  status: string;
};

export class MessageRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async listQueuedByCampaign(
    campaignId: number,
    limit: number
  ): Promise<MessageRow[]> {
    const result = await this.pool.query<MessageRow>(
      "SELECT id, campaign_id, recipient, payload, status FROM messages WHERE campaign_id = $1 AND status = $2 ORDER BY id ASC LIMIT $3",
      [campaignId, MessageStatus.QUEUED, limit]
    );
    return result.rows;
  }

  async countQueuedByCampaign(campaignId: number): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM messages WHERE campaign_id = $1 AND status = $2",
      [campaignId, MessageStatus.QUEUED]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async markSent(messageId: number): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, sent_at = NOW(), updated_at = NOW() WHERE id = $1",
      [messageId, MessageStatus.SENT]
    );
  }

  async markFailed(messageId: number, error: string): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, last_error = $3, attempts = attempts + 1, updated_at = NOW() WHERE id = $1",
      [messageId, MessageStatus.FAILED, error]
    );
  }
}

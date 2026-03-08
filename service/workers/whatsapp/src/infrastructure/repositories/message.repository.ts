import type { Pool } from "pg";

import { MessageStatus } from "../../domain/enums";

export type MessageRow = {
  id: number;
  campaign_id: number;
  recipient: string;
  content: string;
  status: string;
};

export class MessageRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async reserveQueuedByCampaign(
    campaignId: number,
    limit: number
  ): Promise<MessageRow[]> {
    const queued = await this.pool.query<{ id: number; recipient: string; norm: string }>(
      `WITH candidates AS (
         SELECT id,
                recipient,
                regexp_replace(recipient, '\\D', '', 'g') AS norm
         FROM messages
         WHERE campaign_id = $1
           AND status = $2
       ),
       sent AS (
         SELECT DISTINCT regexp_replace(recipient, '\\D', '', 'g') AS norm
         FROM messages
         WHERE campaign_id = $1
           AND status = $4
       )
       SELECT DISTINCT ON (candidates.norm) candidates.id, candidates.recipient, candidates.norm
       FROM candidates
       WHERE candidates.norm NOT IN (SELECT norm FROM sent)
       ORDER BY candidates.norm, candidates.id ASC
       LIMIT $3`,
      [campaignId, MessageStatus.PENDING, limit, MessageStatus.SENT]
    );
    const ids = queued.rows.map((row) => row.id);
    const recipients = queued.rows.map((row) => row.recipient);
    const normalizedRecipients = queued.rows.map((row) => row.norm);
    if (!ids.length) {
      return [];
    }
    const result = await this.pool.query<MessageRow>(
      "UPDATE messages SET status = $2, locked_at = NOW() WHERE id = ANY($1) AND status = $3 RETURNING id, campaign_id, recipient, content, status",
      [ids, MessageStatus.PROCESSING, MessageStatus.PENDING]
    );
    if (normalizedRecipients.length) {
      await this.pool.query(
        "UPDATE messages SET status = $2, retry_count = retry_count + 1 WHERE campaign_id = $1 AND status = $4 AND regexp_replace(recipient, '\\D', '', 'g') = ANY($5)",
        [
          campaignId,
          MessageStatus.FAILED,
          MessageStatus.PENDING,
          normalizedRecipients,
        ]
      );
    }
    return result.rows;
  }

  async listQueuedByCampaign(
    campaignId: number,
    limit: number
  ): Promise<MessageRow[]> {
    const result = await this.pool.query<MessageRow>(
      "SELECT id, campaign_id, recipient, content, status FROM messages WHERE campaign_id = $1 AND status = $2 ORDER BY id ASC LIMIT $3",
      [campaignId, MessageStatus.PENDING, limit]
    );
    return result.rows;
  }

  async countQueuedByCampaign(campaignId: number): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM messages WHERE campaign_id = $1 AND status = $2",
      [campaignId, MessageStatus.PENDING]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async countFailedByCampaign(campaignId: number): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "SELECT COUNT(*) AS count FROM messages WHERE campaign_id = $1 AND status = $2",
      [campaignId, MessageStatus.FAILED]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  async hasSentRecipient(campaignId: number, recipient: string): Promise<boolean> {
    const result = await this.pool.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM messages WHERE campaign_id = $1 AND status = $2 AND regexp_replace(recipient, '\\D', '', 'g') = $3) AS exists",
      [campaignId, MessageStatus.SENT, recipient]
    );
    return result.rows[0]?.exists ?? false;
  }

  async markSent(messageId: number): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, sent_at = NOW() WHERE id = $1",
      [messageId, MessageStatus.SENT]
    );
  }

  async markFailed(messageId: number, error: string): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, retry_count = retry_count + 1 WHERE id = $1",
      [messageId, MessageStatus.FAILED]
    );
  }
}

import type { Pool } from "pg";

import { MessageStatus } from "../../domain/enums";

export type MessageRow = {
  id: number;
  campaign_id: number;
  recipient: string;
  content: string;
  status: string;
  idempotency_key?: string | null;
};

export class MessageRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async claimNextBatch(
    campaignId: number,
    workerId: number,
    limit: number
  ): Promise<MessageRow[]> {
    const result = await this.pool.query<MessageRow>(
      `WITH candidates AS (
         SELECT id
         FROM messages
         WHERE campaign_id = $1
           AND status = $2
         ORDER BY id ASC
         FOR UPDATE SKIP LOCKED
         LIMIT $3
       )
       UPDATE messages
       SET status = $4,
           locked_at = NOW(),
           processing_by_worker = $5
       WHERE id IN (SELECT id FROM candidates)
       RETURNING id, campaign_id, recipient, content, status, idempotency_key`,
      [campaignId, MessageStatus.PENDING, limit, MessageStatus.PROCESSING, workerId]
    );
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

  async releaseStaleLocks(maxAgeMinutes: number): Promise<number> {
    const result = await this.pool.query<{ count: string }>(
      "UPDATE messages SET status = $2, locked_at = NULL, processing_by_worker = NULL, processing_sender_id = NULL WHERE status = $1 AND locked_at IS NOT NULL AND locked_at < NOW() - ($3 || ' minutes')::interval RETURNING id",
      [MessageStatus.PROCESSING, MessageStatus.PENDING, maxAgeMinutes]
    );
    return result.rowCount ?? 0;
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

  async hasSentIdempotency(
    campaignId: number,
    idempotencyKey: string | null,
    recipient: string
  ): Promise<boolean> {
    if (idempotencyKey) {
      const result = await this.pool.query<{ exists: boolean }>(
        "SELECT EXISTS (SELECT 1 FROM messages WHERE campaign_id = $1 AND status = $2 AND idempotency_key = $3) AS exists",
        [campaignId, MessageStatus.SENT, idempotencyKey]
      );
      return result.rows[0]?.exists ?? false;
    }
    const result = await this.pool.query<{ exists: boolean }>(
      "SELECT EXISTS (SELECT 1 FROM messages WHERE campaign_id = $1 AND status = $2 AND regexp_replace(recipient, '\\D', '', 'g') = $3) AS exists",
      [campaignId, MessageStatus.SENT, recipient]
    );
    return result.rows[0]?.exists ?? false;
  }

  async markSent(messageId: number, senderId: number): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, sent_at = NOW(), processing_sender_id = $3 WHERE id = $1",
      [messageId, MessageStatus.SENT, senderId]
    );
  }

  async markFailed(
    messageId: number,
    error: string,
    senderId: number | null
  ): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, retry_count = retry_count + 1, processing_sender_id = $3 WHERE id = $1",
      [messageId, MessageStatus.FAILED, senderId]
    );
  }

  async markPending(messageId: number): Promise<void> {
    await this.pool.query(
      "UPDATE messages SET status = $2, locked_at = NULL, processing_by_worker = NULL, processing_sender_id = NULL WHERE id = $1",
      [messageId, MessageStatus.PENDING]
    );
  }
}

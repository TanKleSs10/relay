import type { Pool } from "pg";

export class SendLogRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async create(params: {
    messageId: string;
    campaignId: string;
    senderId: string;
    workerId: string;
    status: string;
    errorMessage?: string | null;
    providerResponse?: string | null;
  }): Promise<void> {
    await this.pool.query(
      "INSERT INTO send_logs (message_id, campaign_id, sender_account_id, worker_id, status, error_message, provider_response) VALUES ($1, $2, $3, $4, $5, $6, $7)",
      [
        params.messageId,
        params.campaignId,
        params.senderId,
        params.workerId,
        params.status,
        params.errorMessage ?? null,
        params.providerResponse ?? null,
      ]
    );
  }
}

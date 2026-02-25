import { Pool } from "pg";

import { Provider, SenderAccountStatus } from "../domain/enums";

export type SenderAccountRow = {
  id: number;
  provider: string;
  phone_number: string | null;
  status: string;
  qr_code: string | null;
  session_id: string | null;
};

export class SenderService {
  private pool: Pool;

  constructor(dbUrl: string) {
    this.pool = new Pool({ connectionString: dbUrl });
  }

  async getCreatedSenders(): Promise<SenderAccountRow[]> {
    const result = await this.pool.query<SenderAccountRow>(
      "SELECT * FROM sender_accounts WHERE status = $1 AND provider = $2",
      [SenderAccountStatus.QR_REQUIRED, Provider.WHATSAPP_WEB]
    );
    return result.rows;
  }

  async markWaitingQr(senderId: number, sessionId: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, session_id = $3, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.QR_REQUIRED, sessionId]
    );
  }

  async updateQr(senderId: number, qrCode: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, qr_code = $3, last_qr_at = NOW(), updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.QR_REQUIRED, qrCode]
    );
  }

  async markReady(senderId: number, phoneNumber: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, phone_number = $3, qr_code = NULL, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.READY, phoneNumber]
    );
  }

  async markDisconnected(senderId: number): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.COOLDOWN]
    );
  }
}

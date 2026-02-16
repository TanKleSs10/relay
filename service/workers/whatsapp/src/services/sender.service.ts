import { Pool } from "pg";

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
      "SELECT * FROM sender_accounts WHERE status = 'CREATED' AND provider = 'whatsapp-web'"
    );
    return result.rows;
  }

  async markWaitingQr(senderId: number, sessionId: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = 'WAITING_QR', session_id = $2, updated_at = NOW() WHERE id = $1",
      [senderId, sessionId]
    );
  }

  async updateQr(senderId: number, qrCode: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = 'WAITING_QR', qr_code = $2, last_qr_at = NOW(), updated_at = NOW() WHERE id = $1",
      [senderId, qrCode]
    );
  }

  async markReady(senderId: number, phoneNumber: string): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = 'READY', phone_number = $2, qr_code = NULL, updated_at = NOW() WHERE id = $1",
      [senderId, phoneNumber]
    );
  }

  async markDisconnected(senderId: number): Promise<void> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = 'DISCONNECTED', updated_at = NOW() WHERE id = $1",
      [senderId]
    );
  }
}

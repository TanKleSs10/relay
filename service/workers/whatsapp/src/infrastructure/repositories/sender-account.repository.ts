import type { Pool } from "pg";

import { SenderAccountEntity } from "../../domain/sender-account.entity";
import type { SenderAccountRepository as SenderAccountRepositoryPort } from "../../domain/sender-account.repository.interface";
import { SenderAccountStatus } from "../../domain/enums";

export class SenderAccountRepository implements SenderAccountRepositoryPort {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(senderId: number): Promise<SenderAccountEntity | null> {
    const result = await this.pool.query(
      "SELECT id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at FROM sender_accounts WHERE id = $1 LIMIT 1",
      [senderId]
    );
    const row = result.rows[0];
    return row ? SenderAccountEntity.fromRow(row) : null;
  }

  async listByStatus(status: SenderAccountStatus): Promise<SenderAccountEntity[]> {
    const result = await this.pool.query(
      "SELECT id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at FROM sender_accounts WHERE status = $1 ORDER BY id DESC",
      [status]
    );
    return result.rows.map((row) => SenderAccountEntity.fromRow(row));
  }

  async listQrRequiredWithoutCode(): Promise<SenderAccountEntity[]> {
    const result = await this.pool.query(
      "SELECT id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at FROM sender_accounts WHERE status = ANY($1) AND qr_code IS NULL ORDER BY id DESC",
      [[
        SenderAccountStatus.CREATED,
        SenderAccountStatus.INITIALIZING,
        SenderAccountStatus.WAITING_QR,
      ]]
    );
    return result.rows.map((row) => SenderAccountEntity.fromRow(row));
  }

  async listAll(): Promise<SenderAccountEntity[]> {
    const result = await this.pool.query(
      "SELECT id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at FROM sender_accounts ORDER BY id DESC"
    );
    return result.rows.map((row) => SenderAccountEntity.fromRow(row));
  }

  async updateStatus(
    senderId: number,
    status: SenderAccountStatus
  ): Promise<SenderAccountEntity> {
    console.log(`Sender ${senderId} -> status ${status}`);
    const result = await this.pool.query(
      "UPDATE sender_accounts SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at",
      [senderId, status]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for status update`);
    }
    return SenderAccountEntity.fromRow(row);
  }

  async updateQr(senderId: number, qrCode: string): Promise<SenderAccountEntity> {
    console.log(`Sender ${senderId} -> status ${SenderAccountStatus.WAITING_QR}`);
    const result = await this.pool.query(
      "UPDATE sender_accounts SET status = $2, qr_code = $3, qr_generated_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at",
      [senderId, SenderAccountStatus.WAITING_QR, qrCode]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for QR update`);
    }
    return SenderAccountEntity.fromRow(row);
  }

  async updateReady(
    senderId: number,
    phoneNumber: string | null
  ): Promise<SenderAccountEntity> {
    console.log(`Sender ${senderId} -> status ${SenderAccountStatus.CONNECTED}`);
    const result = await this.pool.query(
      "UPDATE sender_accounts SET status = $2, phone_number = $3, qr_code = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, phone_number, status, qr_code, qr_generated_at, session_path, cooldown_until, last_sent_at, created_at, updated_at",
      [senderId, SenderAccountStatus.CONNECTED, phoneNumber]
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for CONNECTED update`);
    }
    console.log(`Sender account ${senderId} marked CONNECTED with phone number: ${phoneNumber}`);
    return SenderAccountEntity.fromRow(row);
  }
}

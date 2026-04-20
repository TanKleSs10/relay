import type { Pool } from "pg";

import { SenderEntity } from "../../domain/entities/sender.entity.js";
import type { SenderRepository as SenderRepositoryPort } from "../../domain/interfaces/sender.repository.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";

export class SenderRepository implements SenderRepositoryPort {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(senderId: string): Promise<SenderEntity | null> {
    const result = await this.pool.query(
      `SELECT sa.id,
              sa.phone_number,
              sa.status,
              ss.qr_code,
              ss.qr_generated_at,
              sa.cooldown_until,
              sa.last_sent_at,
              sa.last_seen_at,
              sa.created_at,
              sa.updated_at
       FROM sender_accounts sa
       LEFT JOIN sender_sessions ss ON ss.sender_account_id = sa.id
       WHERE sa.id = $1
       LIMIT 1`,
      [senderId]
    );
    const row = result.rows[0];
    return row ? SenderEntity.fromRow(row) : null;
  }

  async listByStatus(status: SenderAccountStatus): Promise<SenderEntity[]> {
    const result = await this.pool.query(
      `SELECT sa.id,
              sa.phone_number,
              sa.status,
              ss.qr_code,
              ss.qr_generated_at,
              sa.cooldown_until,
              sa.last_sent_at,
              sa.last_seen_at,
              sa.created_at,
              sa.updated_at
       FROM sender_accounts sa
       LEFT JOIN sender_sessions ss ON ss.sender_account_id = sa.id
       WHERE sa.status = $1
       ORDER BY sa.id DESC`,
      [status]
    );
    return result.rows.map((row) => SenderEntity.fromRow(row));
  }

  async listQrRequiredWithoutCode(): Promise<SenderEntity[]> {
    const result = await this.pool.query(
      `SELECT sa.id,
              sa.phone_number,
              sa.status,
              ss.qr_code,
              ss.qr_generated_at,
              sa.cooldown_until,
              sa.last_sent_at,
              sa.last_seen_at,
              sa.created_at,
              sa.updated_at
       FROM sender_accounts sa
       LEFT JOIN sender_sessions ss ON ss.sender_account_id = sa.id
       WHERE sa.status = ANY($1)
         AND ss.qr_code IS NULL
       ORDER BY sa.id DESC`,
      [[
        SenderAccountStatus.CREATED,
        SenderAccountStatus.INITIALIZING,
        SenderAccountStatus.WAITING_QR,
      ]]
    );
    return result.rows.map((row) => SenderEntity.fromRow(row));
  }

  async listAll(): Promise<SenderEntity[]> {
    const result = await this.pool.query(
      `SELECT sa.id,
              sa.phone_number,
              sa.status,
              ss.qr_code,
              ss.qr_generated_at,
              sa.cooldown_until,
              sa.last_sent_at,
              sa.last_seen_at,
              sa.created_at,
              sa.updated_at
       FROM sender_accounts sa
       LEFT JOIN sender_sessions ss ON ss.sender_account_id = sa.id
       ORDER BY sa.id DESC`
    );
    return result.rows.map((row) => SenderEntity.fromRow(row));
  }

  async resetSession(senderId: string): Promise<SenderEntity> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, phone_number = NULL, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.WAITING_QR]
    );
    await this.pool.query(
      `INSERT INTO sender_sessions (sender_account_id, session_key, qr_code, qr_generated_at)
       VALUES ($1, $2, NULL, NULL)
       ON CONFLICT (sender_account_id)
       DO UPDATE SET qr_code = NULL, qr_generated_at = NULL, updated_at = NOW()`,
      [senderId, `sender-${senderId}`]
    );
    const row = await this.findById(senderId);
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for reset`);
    }
    return row;
  }

  async updateStatus(
    senderId: string,
    status: SenderAccountStatus
  ): Promise<SenderEntity> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, updated_at = NOW() WHERE id = $1",
      [senderId, status]
    );
    const row = await this.findById(senderId);
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for status update`);
    }
    return row;
  }

  async updateQr(senderId: string, qrCode: string): Promise<SenderEntity> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.WAITING_QR]
    );
    await this.pool.query(
      `INSERT INTO sender_sessions (sender_account_id, session_key, qr_code, qr_generated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (sender_account_id)
       DO UPDATE SET qr_code = $3, qr_generated_at = NOW(), updated_at = NOW()`,
      [senderId, `sender-${senderId}`, qrCode]
    );
    const row = await this.findById(senderId);
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for QR update`);
    }
    return row;
  }

  async updateReady(
    senderId: string,
    phoneNumber: string | null
  ): Promise<SenderEntity> {
    await this.pool.query(
      "UPDATE sender_accounts SET status = $2, phone_number = $3, updated_at = NOW() WHERE id = $1",
      [senderId, SenderAccountStatus.CONNECTED, phoneNumber]
    );
    await this.pool.query(
      `INSERT INTO sender_sessions (sender_account_id, session_key, last_ready_at, qr_code, qr_generated_at)
       VALUES ($1, $2, NOW(), NULL, NULL)
       ON CONFLICT (sender_account_id)
       DO UPDATE SET last_ready_at = NOW(), qr_code = NULL, qr_generated_at = NULL, updated_at = NOW()`,
      [senderId, `sender-${senderId}`]
    );
    const row = await this.findById(senderId);
    if (!row) {
      throw new Error(`Sender account ${senderId} not found for CONNECTED update`);
    }
    return row;
  }
}

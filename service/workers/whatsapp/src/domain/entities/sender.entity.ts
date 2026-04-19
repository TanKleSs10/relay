import type { SenderAccountStatus } from "../enums";

export class SenderEntity {
  id: string;
  phoneNumber: string | null;
  status: SenderAccountStatus;
  qrCode: string | null;
  qrGeneratedAt: Date | null;
  cooldownUntil: Date | null;
  lastSentAt: Date | null;
  lastSeenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;
    phoneNumber: string | null;
    status: SenderAccountStatus;
    qrCode: string | null;
    qrGeneratedAt: Date | null;
    cooldownUntil: Date | null;
    lastSentAt: Date | null;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.phoneNumber = params.phoneNumber;
    this.status = params.status;
    this.qrCode = params.qrCode;
    this.qrGeneratedAt = params.qrGeneratedAt;
    this.cooldownUntil = params.cooldownUntil;
    this.lastSentAt = params.lastSentAt;
    this.lastSeenAt = params.lastSeenAt;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static fromRow(row: {
    id: string;
    phone_number: string | null;
    status: SenderAccountStatus;
    qr_code: string | null;
    qr_generated_at: Date | null;
    cooldown_until: Date | null;
    last_sent_at: Date | null;
    last_seen_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): SenderEntity {
    return new SenderEntity({
      id: row.id,
      phoneNumber: row.phone_number,
      status: row.status,
      qrCode: row.qr_code,
      qrGeneratedAt: row.qr_generated_at,
      cooldownUntil: row.cooldown_until,
      lastSentAt: row.last_sent_at,
      lastSeenAt: row.last_seen_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

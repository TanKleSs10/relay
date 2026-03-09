import type { SenderAccountStatus } from "../enums";

export class SenderEntity {
  id: number;
  phoneNumber: string | null;
  status: SenderAccountStatus;
  qrCode: string | null;
  qrGeneratedAt: Date | null;
  sessionPath: string | null;
  cooldownUntil: Date | null;
  lastSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: number;
    phoneNumber: string | null;
    status: SenderAccountStatus;
    qrCode: string | null;
    qrGeneratedAt: Date | null;
    sessionPath: string | null;
    cooldownUntil: Date | null;
    lastSentAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.phoneNumber = params.phoneNumber;
    this.status = params.status;
    this.qrCode = params.qrCode;
    this.qrGeneratedAt = params.qrGeneratedAt;
    this.sessionPath = params.sessionPath;
    this.cooldownUntil = params.cooldownUntil;
    this.lastSentAt = params.lastSentAt;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static fromRow(row: {
    id: number;
    phone_number: string | null;
    status: SenderAccountStatus;
    qr_code: string | null;
    qr_generated_at: Date | null;
    session_path: string | null;
    cooldown_until: Date | null;
    last_sent_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): SenderEntity {
    return new SenderEntity({
      id: row.id,
      phoneNumber: row.phone_number,
      status: row.status,
      qrCode: row.qr_code,
      qrGeneratedAt: row.qr_generated_at,
      sessionPath: row.session_path,
      cooldownUntil: row.cooldown_until,
      lastSentAt: row.last_sent_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

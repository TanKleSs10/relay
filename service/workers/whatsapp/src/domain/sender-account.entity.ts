import type { Provider, SenderAccountStatus } from "./enums";

export class SenderAccountEntity {
  id: number;
  provider: Provider;
  phoneNumber: string | null;
  status: SenderAccountStatus;
  qrCode: string | null;
  sessionId: string | null;
  messagesSentHour: number;
  lastUsedAt: Date | null;
  lastQrAt: Date | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: number;
    provider: Provider;
    phoneNumber: string | null;
    status: SenderAccountStatus;
    qrCode: string | null;
    sessionId: string | null;
    messagesSentHour: number;
    lastUsedAt: Date | null;
    lastQrAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.provider = params.provider;
    this.phoneNumber = params.phoneNumber;
    this.status = params.status;
    this.qrCode = params.qrCode;
    this.sessionId = params.sessionId;
    this.messagesSentHour = params.messagesSentHour;
    this.lastUsedAt = params.lastUsedAt;
    this.lastQrAt = params.lastQrAt;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }

  static fromRow(row: {
    id: number;
    provider: string;
    phone_number: string | null;
    status: SenderAccountStatus;
    qr_code: string | null;
    session_id: string | null;
    messages_sent_hour: number;
    last_used_at: Date | null;
    last_qr_at: Date | null;
    created_at: Date;
    updated_at: Date;
  }): SenderAccountEntity {
    return new SenderAccountEntity({
      id: row.id,
      provider: row.provider,
      phoneNumber: row.phone_number,
      status: row.status,
      qrCode: row.qr_code,
      sessionId: row.session_id,
      messagesSentHour: row.messages_sent_hour,
      lastUsedAt: row.last_used_at,
      lastQrAt: row.last_qr_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}

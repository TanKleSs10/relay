import type { SenderEntity } from "../entities/sender.entity.js";
import type { SenderAccountStatus } from "../enums/index.js";

export interface SenderRepository {
  findById(senderId: string): Promise<SenderEntity | null>;
  listByStatus(status: SenderAccountStatus): Promise<SenderEntity[]>;
  listQrRequested(): Promise<SenderEntity[]>;
  listAll(): Promise<SenderEntity[]>;
  resetSession(senderId: string): Promise<SenderEntity>;
  markQrInactive(senderId: string): Promise<SenderEntity>;
  updateQr(senderId: string, qrCode: string): Promise<SenderEntity>;
  updateReady(
    senderId: string,
    phoneNumber: string | null
  ): Promise<SenderEntity>;
  updateStatus(
    senderId: string,
    status: SenderAccountStatus
  ): Promise<SenderEntity>;
}

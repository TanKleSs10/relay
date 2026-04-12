import type { SenderEntity } from "../entities/sender.entity";
import type { SenderAccountStatus } from "../enums";

export interface SenderRepository {
  findById(senderId: string): Promise<SenderEntity | null>;
  listByStatus(status: SenderAccountStatus): Promise<SenderEntity[]>;
  listQrRequiredWithoutCode(): Promise<SenderEntity[]>;
  listAll(): Promise<SenderEntity[]>;
  resetSession(senderId: string): Promise<SenderEntity>;
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

import type { SenderEntity } from "../entities/sender.entity";
import type { SenderAccountStatus } from "../enums";

export interface SenderRepository {
  findById(senderId: number): Promise<SenderEntity | null>;
  listByStatus(status: SenderAccountStatus): Promise<SenderEntity[]>;
  listQrRequiredWithoutCode(): Promise<SenderEntity[]>;
  listAll(): Promise<SenderEntity[]>;
  resetSession(senderId: number): Promise<SenderEntity>;
  updateQr(senderId: number, qrCode: string): Promise<SenderEntity>;
  updateReady(
    senderId: number,
    phoneNumber: string | null
  ): Promise<SenderEntity>;
  updateStatus(
    senderId: number,
    status: SenderAccountStatus
  ): Promise<SenderEntity>;
}

import type { SenderAccountEntity } from "./sender-account.entity";
import type { SenderAccountStatus } from "./enums";

export interface SenderAccountRepository {
  findById(senderId: number): Promise<SenderAccountEntity | null>;
  listByStatus(status: SenderAccountStatus): Promise<SenderAccountEntity[]>;
  updateQr(senderId: number, qrCode: string): Promise<SenderAccountEntity>;
  updateReady(
    senderId: number,
    phoneNumber: string | null
  ): Promise<SenderAccountEntity>;
  updateStatus(
    senderId: number,
    status: SenderAccountStatus
  ): Promise<SenderAccountEntity>;
}

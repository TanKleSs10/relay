import { rm } from "node:fs/promises";
import { join } from "node:path";

import type { MessageProvider } from "../domain/message-provider.interface";
import type { SenderAccountRepository } from "../domain/sender-account.repository.interface";
import { SenderAccountStatus } from "../domain/enums";

const AUTH_DATA_PATH = "/tmp/whatsapp";

export class SenderService {
  private provider: MessageProvider;
  private repository: SenderAccountRepository;

  constructor(provider: MessageProvider, repository: SenderAccountRepository) {
    this.provider = provider;
    this.repository = repository;
  }

  async syncQrRequiredSenders(): Promise<void> {
    const senders = await this.repository.listByStatus(
      SenderAccountStatus.QR_REQUIRED
    );
    if (!senders.length) {
      return;
    }
    console.log(`Found ${senders.length} senders requiring QR code initialization.`);
    await Promise.all(
      senders.map(async (sender) => {
        this.provider.onQr?.(sender.id, async (qr) => {
          console.log(`Received QR for sender ${sender.id}: ${qr}`);
          await this.repository.updateQr(sender.id, qr);
        });
        this.provider.onReady?.(sender.id, async (phoneNumber) => {
          console.log(`Sender ${sender.id} is ready: ${phoneNumber ?? "unknown"}`);
          await this.repository.updateStatus(sender.id, SenderAccountStatus.READY);
        });
        this.provider.onDisconnect?.(sender.id, async () => {
          console.log(`Sender ${sender.id} disconnected`);
          await this.repository.updateStatus(sender.id, SenderAccountStatus.COOLDOWN);
        });
        await this.cleanupAuthState(sender.id);
        await this.provider.initialize(sender.id);
      })
    );
  }

  async initializeSender(senderId: number): Promise<void> {
    this.provider.onQr?.(senderId, async (qr) => {
      await this.repository.updateQr(senderId, qr);
    });
    this.provider.onReady?.(senderId, async (phoneNumber) => {
      console.log(`Sender ${senderId} is ready: ${phoneNumber ?? "unknown"}`);
      await this.repository.updateStatus(senderId, SenderAccountStatus.READY);
    });
    this.provider.onDisconnect?.(senderId, async () => {
      await this.repository.updateStatus(senderId, SenderAccountStatus.COOLDOWN);
    });
    await this.cleanupAuthState(senderId);
    await this.provider.initialize(senderId);
  }

  private async cleanupAuthState(senderId: number): Promise<void> {
    const sessionPath = join(AUTH_DATA_PATH, `session-sender-${senderId}`);
    try {
      await rm(sessionPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Failed to clean auth state for sender ${senderId}`, error);
    }
  }
}

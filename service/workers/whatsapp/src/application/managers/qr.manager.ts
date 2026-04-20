import qrcode from "qrcode";

import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import { delay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";

export class QrManager {
  private initialized = new Set<string>();

  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private logger: Logger
  ) {}

  private registerHandlers(senderId: string) {
    if (this.initialized.has(senderId)) return;
    this.initialized.add(senderId);
    this.provider.onQr?.(senderId, async (qr) => {
      this.logger.info(`qr received for sender ${senderId}`);
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        await this.senderRepository.updateQr(senderId, dataUrl);
      } catch (error) {
        this.logger.error(`qr update failed for sender ${senderId}`, error);
        if (String(error).includes("not found")) {
          await this.provider.clear?.(senderId);
        }
      }
    });

    this.provider.onReady?.(senderId, async (phoneNumber) => {
      this.logger.info(`sender ${senderId} ready`);
      try {
        await this.senderRepository.updateReady(senderId, phoneNumber ?? null);
      } catch (error) {
        this.logger.error(`CONNECTED update failed for ${senderId}`, error);
        if (String(error).includes("not found")) {
          await this.provider.clear?.(senderId);
        }
      }
    });

    this.provider.onDisconnect?.(senderId, async () => {
      this.logger.warn(`sender ${senderId} disconnected`);
      try {
        await this.senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.DISCONNECTED
        );
      } catch (error) {
        this.logger.error(`DISCONNECTED update failed for ${senderId}`, error);
      }
    });
  }

  async tick(): Promise<void> {
    const senders = await this.senderRepository.listQrRequiredWithoutCode();
    if (!senders.length) return;
    for (const sender of senders) {
      this.logger.info(`qr init for sender ${sender.id}`);
      this.registerHandlers(sender.id);
      if (sender.status !== SenderAccountStatus.INITIALIZING) {
        this.logger.info(`sender ${sender.id} -> INITIALIZING`);
        await this.senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.INITIALIZING
        );
      }

      try {
        await this.provider.initialize(sender.id);
      } catch (error) {
        this.logger.error(`INIT failed for sender ${sender.id}`, error);
        await this.senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
        continue;
      }
      await delay(250);
    }
  }
}

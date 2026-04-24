import qrcode from "qrcode";

import { SenderAccountStatus } from "../../domain/enums/index.js";
import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import type { Logger } from "../../utils/logger.js";
import type { SenderRetryController } from "../../utils/sender-retry-controller.js";

export class SenderLifecycleManager {
  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private logger: Logger,
    private retryController: SenderRetryController
  ) {}

  ensureRegistered(senderId: string): void {
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
        this.retryController.recordSuccess(senderId);
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
}

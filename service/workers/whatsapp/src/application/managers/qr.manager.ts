import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { SenderLifecycleManager } from "./sender-lifecycle.manager.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import { delay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";
import type { SenderRetryController } from "../../utils/sender-retry-controller.js";

export class QrManager {
  private initLocked = false;

  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private lifecycleManager: SenderLifecycleManager,
    private logger: Logger,
    private retryController: SenderRetryController
  ) {}

  async tick(): Promise<void> {
    if (this.initLocked) {
      return;
    }
    const senders = await this.senderRepository.listQrRequiredWithoutCode();
    let sender = null;
    for (const candidate of senders) {
      const liveSessionKey = this.provider.getSessionKey?.(candidate.id) ?? null;
      if (liveSessionKey) {
        if (liveSessionKey !== candidate.sessionKey) {
          this.logger.info(
            `sender ${candidate.id} session key changed; clearing stale runtime session`
          );
          this.retryController.recordSuccess(candidate.id);
          await this.provider.clear?.(candidate.id, false);
          sender = candidate;
          break;
        }
        continue;
      }
      if (!this.retryController.canAttempt(candidate.id, candidate.sessionKey)) {
        continue;
      }
      sender = candidate;
      break;
    }
    if (!sender) {
      return;
    }
    this.initLocked = true;
    this.logger.info(`qr init for sender ${sender.id}`);
    this.lifecycleManager.ensureRegistered(sender.id);
    if (sender.status !== SenderAccountStatus.INITIALIZING) {
      this.logger.info(`sender ${sender.id} -> INITIALIZING`);
      await this.senderRepository.updateStatus(
        sender.id,
        SenderAccountStatus.INITIALIZING
      );
    }

    try {
      await this.provider.initialize(sender.id, sender.sessionKey);
      await delay(250);
    } catch (error) {
      const retryState = this.retryController.recordFailure(
        sender.id,
        sender.sessionKey
      );
      this.logger.error(`INIT failed for sender ${sender.id}`, error);
      this.logger.warn(
        `sender ${sender.id} scheduled for retry in ${Math.ceil(
          (retryState.nextRetryAt - Date.now()) / 1000
        )}s after ${retryState.failures} init failures`
      );
      await this.senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
    } finally {
      this.initLocked = false;
    }
  }
}

import type { MessageRepository } from "../../infrastructure/repositories/message.repository.js";
import type { Logger } from "../../utils/logger.js";

export class RecoveryManager {
  constructor(
    private messageRepository: MessageRepository,
    private logger: Logger
  ) {}

  async tick(): Promise<void> {
    const released = await this.messageRepository.releaseStaleLocks(10);
    if (released > 0) {
      this.logger.warn(`released ${released} stale locks`);
    }
  }
}

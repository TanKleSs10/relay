import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import type { SenderEntity } from "../../domain/entities/sender.entity.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { removeAuthSession } from "../../utils/auth.js";
import type { Logger } from "../../utils/logger.js";

export class SessionManager {
  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private logger: Logger
  ) {}

  async tick(): Promise<void> {
    const senders = await this.senderRepository.listAll();
    await cleanupMissingSenders(this.provider, senders, this.logger);
    await syncSessions(this.provider, this.senderRepository, senders, this.logger);
  }
}

async function cleanupMissingSenders(
  provider: MessageProvider,
  senders: SenderEntity[],
  logger: Logger
): Promise<void> {
  const providerIds = new Set(provider.listSenderIds?.() ?? []);
  const dbIds = new Set(senders.map((sender) => sender.id));

  for (const senderId of providerIds) {
    if (!dbIds.has(senderId)) {
      logger.warn(`session for sender ${senderId} missing in DB. cleaning up`);
      await provider.clear?.(senderId, true);
    }
  }
}

async function syncSessions(
  provider: MessageProvider,
  senderRepository: SenderRepository,
  senders: SenderEntity[],
  logger: Logger
): Promise<void> {
  for (const sender of senders) {
    if (
      sender.status === SenderAccountStatus.CONNECTED ||
      sender.status === SenderAccountStatus.DISCONNECTED ||
      sender.status === SenderAccountStatus.SENDING
    ) {
      const state = await provider.getState?.(sender.id);
      if (!state) {
        logger.warn(`sender ${sender.id} state unknown; skipping transition`);
        continue;
      }
      if (state === "CONNECTED") {
        if (sender.status !== SenderAccountStatus.CONNECTED) {
          logger.info(`sender ${sender.id} -> CONNECTED`);
          await senderRepository.updateStatus(
            sender.id,
            SenderAccountStatus.CONNECTED
          );
        }
        continue;
      }
      if (state && (state.startsWith("UNPAIRED") || state === "CONFLICT")) {
        logger.warn(`sender ${sender.id} -> WAITING_QR (${state})`);
        await senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.WAITING_QR
        );
        await provider.clear?.(sender.id);
        await cleanupAuthState(sender.sessionKey, logger);
        continue;
      }
      if (state && state !== "CONNECTED") {
        logger.warn(`sender ${sender.id} -> DISCONNECTED (${state})`);
        await senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.DISCONNECTED
        );
      }
    }

    if (sender.status === SenderAccountStatus.INITIALIZING) {
      continue;
    }

    if (sender.status === SenderAccountStatus.DISCONNECTED) {
      logger.info(`sender ${sender.id} reinitializing`);
      await senderRepository.updateStatus(
        sender.id,
        SenderAccountStatus.INITIALIZING
      );
      try {
        await provider.initialize(sender.id, sender.sessionKey);
      } catch (error) {
        logger.error(`failed to reinitialize sender ${sender.id}`, error);
        await senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
      }
      continue;
    }
  }
}

async function cleanupAuthState(sessionKey: string, logger: Logger): Promise<void> {
  try {
    await removeAuthSession(sessionKey);
  } catch (error) {
    logger.warn(`failed to clean auth state for session ${sessionKey}`);
    if (error) {
      logger.error("cleanup error", error);
    }
  }
}

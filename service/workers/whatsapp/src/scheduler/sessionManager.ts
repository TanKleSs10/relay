import { rm } from "node:fs/promises";
import { join } from "node:path";
import type { Pool } from "pg";
import type { MessageProvider } from "../domain/message-provider.interface";
import { SenderAccountStatus } from "../domain/enums";
import type { SenderAccountEntity } from "../domain/sender-account.entity";
import { SenderAccountRepository } from "../infrastructure/repositories/sender-account.repository";
import { createMessageProvider } from "../infrastructure/providers/provider.factory";

const AUTH_DATA_PATH = "/tmp/whatsapp";

export function initSessionManager(pool: Pool, provider?: MessageProvider) {
  const managerProvider = provider ?? createMessageProvider();
  const senderRepository = new SenderAccountRepository(pool);

  const tick = async () => {
    const senders = await senderRepository.listAll();
    await cleanupMissingSenders(managerProvider, senders);
    await syncSessions(managerProvider, senderRepository, senders);
  };
  return { tick };
}

async function cleanupMissingSenders(
  provider: MessageProvider,
  senders: SenderAccountEntity[]
): Promise<void> {
  const providerIds = new Set(provider.listSenderIds?.() ?? []);
  const dbIds = new Set(senders.map((sender) => sender.id));

  for (const senderId of providerIds) {
    if (!dbIds.has(senderId)) {
      console.warn(`Session for sender ${senderId} missing in DB. Cleaning up.`);
      await provider.clear?.(senderId);
      await cleanupAuthState(senderId);
    }
  }
}

async function syncSessions(
  provider: MessageProvider,
  senderRepository: SenderAccountRepository,
  senders: SenderAccountEntity[]
): Promise<void> {
  for (const sender of senders) {
    if (
      sender.status === SenderAccountStatus.CONNECTED ||
      sender.status === SenderAccountStatus.SENDING ||
      sender.status === SenderAccountStatus.DISCONNECTED
    ) {
      const state = await provider.getState?.(sender.id);
      if (state === "CONNECTED") {
        if (sender.status !== SenderAccountStatus.CONNECTED) {
          await senderRepository.updateStatus(
            sender.id,
            SenderAccountStatus.CONNECTED
          );
        }
        continue;
      }
      if (state && (state.startsWith("UNPAIRED") || state === "CONFLICT")) {
        await senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.WAITING_QR
        );
        await provider.clear?.(sender.id);
        await cleanupAuthState(sender.id);
        continue;
      }
      if (state && state !== "CONNECTED") {
        await senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.DISCONNECTED
        );
      }
    }

    if (sender.status === SenderAccountStatus.DISCONNECTED) {
      await senderRepository.updateStatus(
        sender.id,
        SenderAccountStatus.INITIALIZING
      );
      try {
        await provider.initialize(sender.id);
      } catch (error) {
        console.error(`Failed to reinitialize sender ${sender.id}`, error);
        await senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
      }
      continue;
    }
  }
}

async function cleanupAuthState(senderId: number): Promise<void> {
  const sessionPath = join(AUTH_DATA_PATH, `session-sender-${senderId}`);
  try {
    await rm(sessionPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`Failed to clean auth state for sender ${senderId}`, error);
  }
}

import { rm } from "node:fs/promises";
import { join } from "node:path";

import type { Pool } from "pg";
import qrcode from "qrcode";

import { SenderAccountStatus } from "../domain/enums";
import { CampaignDispatchService } from "../application/campaign-dispatch.service";
import { createMessageProvider } from "../infrastructure/providers/provider.factory";
import { CampaignRepository } from "../infrastructure/repositories/campaign.repository";
import { MessageRepository } from "../infrastructure/repositories/message.repository";
import { SenderAccountRepository } from "../infrastructure/repositories/sender-account.repository";
import type { SenderAccountEntity } from "../domain/sender-account.entity";

const LOOP_INTERVAL_MS = 2000;
const AUTH_DATA_PATH = "/tmp/whatsapp";

export function startLoop(pool: Pool, workerName: string): void {
  const provider = createMessageProvider();
  const senderRepository = new SenderAccountRepository(pool);
  const messageRepository = new MessageRepository(pool);
  const campaignRepository = new CampaignRepository(pool);
  const dispatchService = new CampaignDispatchService(
    provider,
    senderRepository,
    messageRepository,
    campaignRepository
  );
  let tickCount = 0;
  const bootstrappedAt = new Map<number, number>();

  // The tick function checks for senders that require QR code initialization and sets up the necessary event handlers.
  const tick = async () => {
    try {
      tickCount += 1;
      const senders = await senderRepository.listQrRequiredWithoutCode();
      if (senders.length > 0) {
        console.log(
          `Found ${senders.length} senders requiring QR code initialization.`
        );
        await Promise.all(
          senders.map(async (sender) => {
            provider.onQr?.(sender.id, async (qr) => {
              console.log(`QR for sender ${sender.id}`);
              try {
                const dataUrl = await qrcode.toDataURL(qr);
                await senderRepository.updateQr(sender.id, dataUrl);
                console.log(`QR saved for sender ${sender.id}`);
              } catch (error) {
                console.error(`Failed to save QR for sender ${sender.id}`, error);
                if (String(error).includes("not found")) {
                  await provider.clear?.(sender.id);
                }
              }
            });
            provider.onReady?.(sender.id, async (phoneNumber) => {
              console.log(
                `Sender ${sender.id} is ready: ${phoneNumber ?? "unknown"}`
              );
              try {
                await senderRepository.updateReady(sender.id, phoneNumber ?? null);
                console.log(`Sender ${sender.id} marked CONNECTED`);
              } catch (error) {
                console.error(
                  `Failed to mark CONNECTED for sender ${sender.id}`,
                  error
                );
                if (String(error).includes("not found")) {
                  await provider.clear?.(sender.id);
                }
              }
            });
            await provider.initialize(sender.id);
          })
        );
      }
      if (tickCount % 5 === 0) {
        const sendersInDb = await senderRepository.listAll();
        await syncSenderSessions(
          provider,
          senderRepository,
          sendersInDb,
          bootstrappedAt,
          tickCount
        );
      }
      await dispatchService.dispatchOnce();
    } catch (error) {
      console.error("Sender loop failed:", error);
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, LOOP_INTERVAL_MS);
}

async function syncSenderSessions(
  provider: ReturnType<typeof createMessageProvider>,
  senderRepository: SenderAccountRepository,
  sendersInDb: SenderAccountEntity[],
  bootstrappedAt: Map<number, number>,
  tickCount: number
): Promise<void> {
  const providerIds = new Set(provider.listSenderIds?.() ?? []);
  const dbIds = new Set(sendersInDb.map((sender) => sender.id));

  for (const senderId of providerIds) {
    if (!dbIds.has(senderId)) {
      console.warn(`Sender ${senderId} missing in DB. Cleaning session.`);
      await provider.clear?.(senderId);
      await cleanupAuthState(senderId);
    }
  }

  for (const sender of sendersInDb) {
    if (sender.status === SenderAccountStatus.CONNECTED) {
      if (!providerIds.has(sender.id)) {
        console.log(`Bootstrapping CONNECTED sender ${sender.id}`);
        await provider.initialize(sender.id);
        bootstrappedAt.set(sender.id, tickCount);
      }
      if (provider.getState) {
        const bootTick = bootstrappedAt.get(sender.id);
        if (bootTick !== undefined && tickCount - bootTick < 3) {
          continue;
        }
        const state = await provider.getState(sender.id);
        console.log(`Sender ${sender.id} current state: ${state ?? "unknown"}`);
        if (state && state !== "CONNECTED") {
          const nextStatus =
            state.startsWith("UNPAIRED") || state === "CONFLICT"
              ? SenderAccountStatus.WAITING_QR
              : SenderAccountStatus.DISCONNECTED;
          console.warn(
            `Sender ${sender.id} in state ${state}. Marking ${nextStatus}.`
          );
          try {
            await senderRepository.updateStatus(sender.id, nextStatus);
            if (nextStatus === SenderAccountStatus.WAITING_QR) {
              await provider.clear?.(sender.id);
              await cleanupAuthState(sender.id);
            }
          } catch (error) {
            console.error(`Failed to update status for sender ${sender.id}`, error);
          }
        }
      }
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

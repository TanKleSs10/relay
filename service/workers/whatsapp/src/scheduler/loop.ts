import type { Pool } from "pg";
import qrcode from "qrcode";

import { SenderAccountStatus } from "../domain/enums";
import { CampaignDispatchService } from "../application/campaign-dispatch.service";
import { createMessageProvider } from "../infrastructure/providers/provider.factory";
import { CampaignRepository } from "../infrastructure/repositories/campaign.repository";
import { MessageRepository } from "../infrastructure/repositories/message.repository";
import { SenderAccountRepository } from "../infrastructure/repositories/sender-account.repository";
import { WorkerRepository } from "../infrastructure/repositories/worker.repository";

const LOOP_INTERVAL_MS = 3000;

export function startLoop(pool: Pool, workerName: string): void {
  const provider = createMessageProvider();
  const senderRepository = new SenderAccountRepository(pool);
  const workerRepository = new WorkerRepository(pool);
  const messageRepository = new MessageRepository(pool);
  const campaignRepository = new CampaignRepository(pool);
  const dispatchService = new CampaignDispatchService(
    provider,
    senderRepository,
    workerRepository,
    messageRepository,
    campaignRepository
  );

  // The tick function checks for senders that require QR code initialization and sets up the necessary event handlers.
  const tick = async () => {
    try {
      const senders = await senderRepository.listByStatus(
        SenderAccountStatus.QR_REQUIRED
      );
      if (senders.length) {
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
              }
            });
            provider.onReady?.(sender.id, async (phoneNumber) => {
              console.log(
                `Sender ${sender.id} is ready: ${phoneNumber ?? "unknown"}`
              );
              try {
                await senderRepository.updateReady(sender.id, phoneNumber ?? null);
                console.log(`Sender ${sender.id} marked READY`);
              } catch (error) {
                console.error(
                  `Failed to mark READY for sender ${sender.id}`,
                  error
                );
              }
            });
            await provider.initialize(sender.id);
          })
        );
      }
      await dispatchService.dispatchOnce(workerName);
    } catch (error) {
      console.error("Sender loop failed:", error);
    }
  };

  void tick();
  setInterval(() => {
    void tick();
  }, LOOP_INTERVAL_MS);
}

import type { Pool } from "pg";
import qrcode from "qrcode";

import { SenderAccountStatus } from "../domain/enums";
import { createMessageProvider } from "../infrastructure/providers/provider.factory";
import { SenderAccountRepository } from "../infrastructure/repositories/sender-account.repository";

const LOOP_INTERVAL_MS = 3000;

export function startLoop(pool: Pool): void {
  const provider = createMessageProvider();
  const senderRepository = new SenderAccountRepository(pool);

  // The tick function checks for senders that require QR code initialization and sets up the necessary event handlers.
  const tick = async () => {
    try {
      const senders = await senderRepository.listByStatus(
        SenderAccountStatus.QR_REQUIRED
      );
      if (!senders.length) {
        return;
      }
      console.log(`Found ${senders.length} senders requiring QR code initialization.`);
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
              console.error(`Failed to mark READY for sender ${sender.id}`, error);
            }
          });
          await provider.initialize(sender.id);
        })
      );
    } catch (error) {
      console.error("Sender loop failed:", error);
    }
  };

  // 


  void tick();
  setInterval(() => {
    void tick();
  }, LOOP_INTERVAL_MS);
}

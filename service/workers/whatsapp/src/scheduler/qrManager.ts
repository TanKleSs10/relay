import type { Pool } from "pg";
import qrcode from "qrcode";

import { SenderAccountRepository } from "../infrastructure/repositories/sender-account.repository";
import { createMessageProvider } from "../infrastructure/providers/provider.factory";
import { delay } from "../utils/delay";
import { SenderAccountStatus } from "../domain/enums";

export function initQrManager(pool: Pool) {
  const provider = createMessageProvider();
  const senderRepository = new SenderAccountRepository(pool);
  const initialized = new Set<number>();

  const registerHandlers = (senderId: number) => {
    if (initialized.has(senderId)) return;
    initialized.add(senderId);
    provider.onQr?.(senderId, async (qr) => {
      console.log(`QR for sender ${senderId}`);
      try {
        const dataUrl = await qrcode.toDataURL(qr);
        await senderRepository.updateQr(senderId, dataUrl);
      } catch (error) {
        console.error(`Failed QR ${senderId}`, error);
        if (String(error).includes("not found")) {
          await provider.clear?.(senderId);
        }
      }
    });

    provider.onReady?.(senderId, async (phoneNumber) => {
      console.log(`Sender ${senderId} ready`);
      try {
        await senderRepository.updateReady(senderId, phoneNumber ?? null);
      } catch (error) {
        console.error(`CONNECTED error ${senderId}`, error);
        if (String(error).includes("not found")) {
          await provider.clear?.(senderId);
        }
      }
    });

    provider.onDisconnect?.(senderId, async () => {
      console.log(`Sender ${senderId} disconnected`);
      try {
        await senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.DISCONNECTED
        );
      } catch (error) {
        console.error(`DISCONNECTED error ${senderId}`, error);
      }
    });
  };

  const tick = async () => {
    const senders = await senderRepository.listQrRequiredWithoutCode();
    if (!senders.length) return;
    for (const sender of senders) {
      registerHandlers(sender.id);
      if (sender.status !== SenderAccountStatus.INITIALIZING) {
        await senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.INITIALIZING
        );
      }

      try {
        await provider.initialize(sender.id);
      } catch (error) {
        console.error(`INIT error ${sender.id}`, error);
        await senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
        continue;
      }
      await delay(250);
    }
  };
  return { tick };
}

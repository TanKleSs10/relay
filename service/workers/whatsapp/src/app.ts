import QRCode from "qrcode";

import { WhatsAppProvider } from "./providers/whatsapp.provider";
import { SenderService } from "./services/sender.service";

const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  throw new Error("DB_URL is required");
}

const senderService = new SenderService(dbUrl);
const activeClients = new Map<number, WhatsAppProvider>();

async function initSender(senderId: number): Promise<void> {
  if (activeClients.has(senderId)) {
    return;
  }

  const provider = new WhatsAppProvider(String(senderId));
  activeClients.set(senderId, provider);

  await senderService.markWaitingQr(senderId, String(senderId));

  provider.showQrInTerminal();

  provider.onQr(async (qr) => {
    const dataUrl = await QRCode.toDataURL(qr);
    await senderService.updateQr(senderId, dataUrl);
  });

  provider.onReady(async (client) => {
    const phoneNumber = client.info?.wid?.user || "";
    await senderService.markReady(senderId, phoneNumber);
  });

  provider.onDisconnected(async () => {
    await senderService.markDisconnected(senderId);
    activeClients.delete(senderId);
  });

  provider.initialize();
}

async function pollSenders(): Promise<void> {
  try {
    const senders = await senderService.getCreatedSenders();
    for (const sender of senders) {
      await initSender(sender.id);
    }
  } catch (error) {
    console.error("Error polling sender accounts", error);
  }
}

setInterval(() => {
  void pollSenders();
}, 3000);

void pollSenders();

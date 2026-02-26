import whatsapp from "whatsapp-web.js";
import type { Client } from "whatsapp-web.js";

import type { MessageProvider } from "../../domain/message-provider.interface";

type SenderEntry = {
  client?: Client;
  onQr?: (qr: string) => void;
  onReady?: (phoneNumber: string | null) => void;
  onDisconnect?: () => void;
  initializing?: boolean;
};

// Adapter that isolates whatsapp-web.js usage behind MessageProvider.
export class WhatsAppWebProvider implements MessageProvider {
  private clients = new Map<number, SenderEntry>();

  async initialize(senderId: number): Promise<void> {
    // Create or reuse a client for a sender and forward events to callbacks.
    const existing = this.clients.get(senderId);
    if (existing?.client || existing?.initializing) {
      return;
    }

    const { Client, LocalAuth } = whatsapp as {
      Client: typeof whatsapp.Client;
      LocalAuth: typeof whatsapp.LocalAuth;
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: `sender-${senderId}`,
        dataPath: "/tmp/whatsapp",
      }),
      puppeteer: {
        args: process.env.NO_SANDBOX === "1" ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
      },
    });

    const entry: SenderEntry = existing ?? {};
    entry.initializing = true;
    entry.client = client;
    this.clients.set(senderId, entry);

    client.on("qr", (qr: string) => {
      console.log(`Provider QR event for sender ${senderId}`);
      entry.onQr?.(qr);
    });
    client.on("ready", () => {
      console.log(`Provider ready event for sender ${senderId}`);
      entry.initializing = false;
      const info = (client as any).info;
      const phone =
        info?.wid?.user ??
        info?.me?.id?.user ??
        info?.me?.user ??
        null;
      entry.onReady?.(phone);
    });
    client.on("disconnected", () => {
      console.log(`Provider disconnected event for sender ${senderId}`);
      entry.initializing = false;
      entry.onDisconnect?.();
    });
    client.on("auth_failure", (message: string) => {
      console.error(`Provider auth failure for sender ${senderId}: ${message}`);
      entry.initializing = false;
    });
    client.on("authenticated", () => {
      console.log(`Provider authenticated event for sender ${senderId}`);
    });
    client.on("loading_screen", (percent: number, message: string) => {
      console.log(`Provider loading ${percent}% for sender ${senderId}: ${message}`);
    });
    client.on("change_state", (state: string) => {
      console.log(`Provider state change for sender ${senderId}: ${state}`);
    });
    client.on("message", async (message: any) => {
      const body = String(message?.body ?? "").trim().toLowerCase();
      if (body === "si") {
        await client.sendMessage(
          message.from,
          "este es un mensaje de prueba desde relay por exitus credit, favor de ignoralo."
        );
      }
    });

    console.log(`Initializing WhatsApp client for sender ${senderId}`);
    try {
      client.initialize();
      console.log(`WhatsApp client initialize called for sender ${senderId}`);
    } catch (error) {
      entry.initializing = false;
      console.error(`WhatsApp client failed to initialize for sender ${senderId}`, error);
      throw error;
    }
  }

  async sendMessage(senderId: number, to: string, message: string): Promise<void> {
    const entry = this.clients.get(senderId);
    if (!entry?.client) {
      throw new Error(`Sender ${senderId} is not initialized`);
    }
    const recipient = normalizeRecipient(to);
    if (recipient !== to) {
      console.log(`Normalized recipient for sender ${senderId}: ${to} -> ${recipient}`);
    }
    await entry.client.sendMessage(recipient, message);
  }

  onQr(senderId: number, callback: (qr: string) => void): void {
    // Register QR callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onQr = callback;
    this.clients.set(senderId, entry);
  }

  onReady(senderId: number, callback: (phoneNumber: string | null) => void): void {
    // Register ready callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onReady = callback;
    this.clients.set(senderId, entry);
  }

  onDisconnect(senderId: number, callback: () => void): void {
    // Register disconnect callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onDisconnect = callback;
    this.clients.set(senderId, entry);
  }

  async clear(senderId: number): Promise<void> {
    const entry = this.clients.get(senderId);
    if (entry?.client) {
      try {
        await entry.client.destroy();
      } catch (error) {
        console.warn(`Failed to destroy client for sender ${senderId}`, error);
      }
    }
    this.clients.delete(senderId);
  }

  listSenderIds(): number[] {
    return Array.from(this.clients.keys());
  }

  async getState(senderId: number): Promise<string | null> {
    const entry = this.clients.get(senderId);
    if (!entry?.client) {
      return null;
    }
    try {
      return await entry.client.getState();
    } catch (error) {
      console.warn(`Failed to get state for sender ${senderId}`, error);
      return null;
    }
  }
}

function normalizeRecipient(to: string): string {
  if (to.includes("@c.us") || to.includes("@g.us")) {
    return to;
  }
  const digits = to.replace(/[^\d]/g, "");
  return `${digits}@c.us`;
}

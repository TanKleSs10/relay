import whatsapp from "whatsapp-web.js";
import type { Client, Message } from "whatsapp-web.js";

import type {
  MessageProvider,
  OutboundMedia,
} from "../../domain/interfaces/message-provider.interface.js";
import { AUTH_DATA_PATH, removeAuthSession } from "../../utils/auth.js";
import { classifyWorkerError } from "../../utils/error-classifier.js";
import type { WorkerEventBus } from "../../utils/worker-events.js";

type SenderEntry = {
  sessionKey?: string;
  client?: Client;
  onQr?: (qr: string) => void;
  onReady?: (phoneNumber: string | null) => void;
  onDisconnect?: () => void;
  initializing?: boolean;
  authenticatedHandled?: boolean;
  readyHandled?: boolean;
  clearing?: boolean;
};

const MESSAGE_ACK_SERVER = 1;
const MESSAGE_ACK_ERROR = -1;
const MESSAGE_ACK_TIMEOUT_MS = 12_000;
const MESSAGE_ACK_POLL_INTERVAL_MS = 400;

// Adapter that isolates whatsapp-web.js usage behind MessageProvider.
export class WhatsAppProvider implements MessageProvider {
  private clients = new Map<string, SenderEntry>();

  constructor(private eventBus: WorkerEventBus) {}

  async initialize(senderId: string, sessionKey: string): Promise<void> {
    // Create or reuse a client for a sender and forward events to callbacks.
    const existing = this.clients.get(senderId);
    if (
      existing?.sessionKey &&
      existing.sessionKey !== sessionKey
    ) {
      await this.clear(senderId, false);
      await removeAuthSession(existing.sessionKey);
    }
    if (
      existing?.sessionKey === sessionKey &&
      (existing.client || existing.initializing)
    ) {
      return;
    }

    const { Client, LocalAuth } = whatsapp as {
      Client: typeof whatsapp.Client;
      LocalAuth: typeof whatsapp.LocalAuth;
    };

    const client = new Client({
      authStrategy: new LocalAuth({
        clientId: sessionKey,
        dataPath: AUTH_DATA_PATH,
      }),
      puppeteer: {
        args: process.env.NO_SANDBOX === "1" ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
      },
    });

    const entry: SenderEntry = existing ?? {};
    entry.initializing = true;
    entry.sessionKey = sessionKey;
    entry.client = client;
    entry.authenticatedHandled = false;
    entry.readyHandled = false;
    entry.clearing = false;
    this.clients.set(senderId, entry);
    this.eventBus.emit({
      type: "sender.init.started",
      payload: { senderId, sessionKey },
    });

    client.on("qr", (qr: string) => {
      this.eventBus.emit({
        type: "sender.qr.generated",
        payload: { senderId, sessionKey },
      });
      void Promise.resolve(entry.onQr?.(qr)).catch((error) => {
        this.eventBus.emit({
          type: "sender.init.failed",
          payload: {
            senderId,
            sessionKey,
            error,
            category: classifyWorkerError(error),
          },
        });
      });
    });
    client.on("ready", () => {
      if (entry.readyHandled) {
        return;
      }
      entry.readyHandled = true;
      entry.initializing = false;
      const info = (client as any).info;
      const phone =
        info?.wid?.user ??
        info?.me?.id?.user ??
        info?.me?.user ??
        null;
      this.eventBus.emit({
        type: "sender.ready",
        payload: { senderId, sessionKey },
      });
      void Promise.resolve(entry.onReady?.(phone)).catch((error) => {
        this.eventBus.emit({
          type: "sender.init.failed",
          payload: {
            senderId,
            sessionKey,
            error,
            category: classifyWorkerError(error),
          },
        });
      });
    });
    client.on("disconnected", (reason: string) => {
      entry.initializing = false;
      if (entry.clearing) {
        return;
      }
      this.eventBus.emit({
        type: "sender.disconnected",
        payload: { senderId, sessionKey, reason },
      });
      void Promise.resolve(entry.onDisconnect?.()).catch((error) => {
        this.eventBus.emit({
          type: "sender.init.failed",
          payload: {
            senderId,
            sessionKey,
            error,
            reason,
            category: classifyWorkerError(error),
          },
        });
      });
      void this.clear(senderId, false);
    });
    client.on("auth_failure", (message: string) => {
      entry.initializing = false;
      this.eventBus.emit({
        type: "sender.auth_failure",
        payload: {
          senderId,
          sessionKey,
          reason: message,
          category: "auth_invalid",
        },
      });
      void this.clear(senderId, false);
    });
    client.on("authenticated", () => {
      if (entry.authenticatedHandled) {
        return;
      }
      entry.authenticatedHandled = true;
      this.eventBus.emit({
        type: "sender.authenticated",
        payload: { senderId, sessionKey },
      });
    });
    client.on("loading_screen", (percent: number, message: string) => {
      this.eventBus.emit({
        type: "sender.state.changed",
        payload: {
          senderId,
          sessionKey,
          state: `LOADING_${percent}`,
          reason: message,
        },
      });
    });
    client.on("change_state", (state: string) => {
      this.eventBus.emit({
        type: "sender.state.changed",
        payload: { senderId, sessionKey, state },
      });
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

    try {
      await client.initialize();
      this.eventBus.emit({
        type: "sender.init.succeeded",
        payload: { senderId, sessionKey },
      });
    } catch (error) {
      entry.initializing = false;
      await this.clear(senderId, false);
      this.eventBus.emit({
        type: "sender.init.failed",
        payload: {
          senderId,
          sessionKey,
          error,
          category: classifyWorkerError(error),
        },
      });
      throw error;
    }
  }

  async sendMessage(
    senderId: string,
    to: string,
    message: string,
    media: OutboundMedia[] = []
  ): Promise<void> {
    const entry = this.clients.get(senderId);
    if (!entry?.client) {
      throw new Error(`Sender ${senderId} is not initialized`);
    }
    if (entry.initializing) {
      throw new Error(`Sender ${senderId} is initializing`);
    }
    const recipient = normalizeRecipient(to);
    this.eventBus.emit({
      type: "sender.send.started",
      payload: { senderId, sessionKey: entry.sessionKey, recipient },
    });
    try {
      if (media.length === 0) {
        const sentMessage = await entry.client.sendMessage(recipient, message);
        await waitForConfirmedAck(entry.client, sentMessage);
      } else {
        const MessageMedia = (whatsapp as any).MessageMedia;
        for (const [index, item] of media.entries()) {
          const outboundMedia = await MessageMedia.fromUrl(item.url, {
            filename: item.filename ?? undefined,
            unsafeMime: true,
          });
          const options =
            index === 0 && message.trim()
              ? { caption: message }
              : undefined;
          const sentMessage = await entry.client.sendMessage(
            recipient,
            outboundMedia,
            options
          );
          await waitForConfirmedAck(entry.client, sentMessage);
        }
      }
      this.eventBus.emit({
        type: "sender.send.succeeded",
        payload: { senderId, sessionKey: entry.sessionKey, recipient },
      });
    } catch (error) {
      this.eventBus.emit({
        type: "sender.send.failed",
        payload: {
          senderId,
          sessionKey: entry.sessionKey,
          recipient,
          error,
          category: classifyWorkerError(error),
        },
      });
      throw error;
    }
  }

  onQr(senderId: string, callback: (qr: string) => void): void {
    // Register QR callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onQr = callback;
    this.clients.set(senderId, entry);
  }

  onReady(senderId: string, callback: (phoneNumber: string | null) => void): void {
    // Register ready callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onReady = callback;
    this.clients.set(senderId, entry);
  }

  onDisconnect(senderId: string, callback: () => void): void {
    // Register disconnect callback before or after initialize.
    const entry = this.clients.get(senderId) ?? {};
    entry.onDisconnect = callback;
    this.clients.set(senderId, entry);
  }

  async clear(senderId: string, destroyAuth = false): Promise<void> {
    const entry = this.clients.get(senderId);
    if (entry?.client) {
      entry.clearing = true;
      try {
        await (entry.client as any).destroy();
      } catch (error) {
        console.warn(`Failed to destroy client for sender ${senderId}`, error);
      }
    }
    if (destroyAuth && entry?.sessionKey) {
      await removeAuthSession(entry.sessionKey);
    }
    this.clients.delete(senderId);
    this.eventBus.emit({
      type: "sender.client.cleared",
      payload: {
        senderId,
        sessionKey: entry?.sessionKey,
        reason: destroyAuth ? "client_and_auth_cleared" : "client_cleared",
      },
    });
  }

  listSenderIds(): string[] {
    return Array.from(this.clients.keys());
  }

  getSessionKey(senderId: string): string | null {
    return this.clients.get(senderId)?.sessionKey ?? null;
  }

  async getState(senderId: string): Promise<string | null> {
    const entry = this.clients.get(senderId);
    if (!entry?.client || entry.initializing) {
      return null;
    }
    const clientAny = entry.client as any;
    if (!clientAny?.pupPage) {
      return null;
    }
    try {
      return await clientAny.getState();
    } catch (error) {
      this.eventBus.emit({
        type: "sender.init.failed",
        payload: {
          senderId,
          sessionKey: entry.sessionKey,
          error,
          category: classifyWorkerError(error),
        },
      });
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

async function waitForConfirmedAck(
  client: Client,
  message: Message
): Promise<void> {
  const messageId = message?.id?._serialized;
  if (!messageId) {
    throw new Error("message ack unavailable: missing message id");
  }

  const startedAt = Date.now();
  let currentAck = message.ack;

  while (Date.now() - startedAt < MESSAGE_ACK_TIMEOUT_MS) {
    if (currentAck >= MESSAGE_ACK_SERVER) {
      return;
    }
    if (currentAck === MESSAGE_ACK_ERROR) {
      throw new Error(`message ack error for ${messageId}`);
    }

    await delay(MESSAGE_ACK_POLL_INTERVAL_MS);
    const refreshed = await client.getMessageById(messageId);
    currentAck = refreshed?.ack ?? currentAck;
  }

  throw new Error(`message ack timeout for ${messageId}`);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

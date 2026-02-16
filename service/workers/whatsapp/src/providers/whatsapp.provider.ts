import { Client, LocalAuth, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";

export class WhatsAppProvider {
  private client: Client;

  constructor(clientId: string) {
    this.client = new Client({
      authStrategy: new LocalAuth({ clientId }),
    });
  }

  onReady(handler: (client: Client) => void): void {
    this.client.on("ready", () => handler(this.client));
  }

  onMessage(handler: (msg: Message) => void | Promise<void>): void {
    this.client.on("message", handler);
  }

  onQr(handler: (qr: string) => void | Promise<void>): void {
    this.client.on("qr", handler);
  }

  onDisconnected(handler: (reason: string) => void | Promise<void>): void {
    this.client.on("disconnected", handler);
  }

  initialize(): void {
    this.client.initialize();
  }

  showQrInTerminal(): void {
    this.client.on("qr", (qr: string) => {
      qrcode.generate(qr, { small: true });
    });
  }
}

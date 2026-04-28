declare module "whatsapp-web.js" {
  export interface MessageId {
    fromMe: boolean;
    remote: string;
    id: string;
    _serialized: string;
  }
  export interface Message {
    id: MessageId;
    ack: number;
    fromMe: boolean;
  }
  export class Client {
    constructor(options?: unknown);
    on(event: string, handler: (...args: any[]) => void): void;
    getMessageById(messageId: string): Promise<Message>;
    sendMessage(
      to: string,
      message: unknown,
      options?: Record<string, unknown>
    ): Promise<Message>;
    initialize(): void;
  }
  export class MessageMedia {
    static fromUrl(
      url: string,
      options?: Record<string, unknown>
    ): Promise<MessageMedia>;
  }
  export class LocalAuth {
    constructor(options?: unknown);
  }
  const whatsapp: {
    Client: typeof Client;
    MessageMedia: typeof MessageMedia;
    LocalAuth: typeof LocalAuth;
  };
  export default whatsapp;
}
declare module "qrcode-terminal";
declare module "qrcode";

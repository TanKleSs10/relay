declare module "whatsapp-web.js" {
  export class Client {
    constructor(options?: unknown);
    on(event: string, handler: (...args: any[]) => void): void;
    sendMessage(
      to: string,
      message: unknown,
      options?: Record<string, unknown>
    ): Promise<void>;
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
  export type Message = any;
  const whatsapp: {
    Client: typeof Client;
    MessageMedia: typeof MessageMedia;
    LocalAuth: typeof LocalAuth;
  };
  export default whatsapp;
}
declare module "qrcode-terminal";
declare module "qrcode";

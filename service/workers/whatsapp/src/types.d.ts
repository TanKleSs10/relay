declare module "whatsapp-web.js" {
  export class Client {
    constructor(options?: unknown);
    on(event: string, handler: (...args: any[]) => void): void;
    sendMessage(to: string, message: string): Promise<void>;
    initialize(): void;
  }
  export class LocalAuth {
    constructor(options?: unknown);
  }
  export type Message = any;
  const whatsapp: {
    Client: typeof Client;
    LocalAuth: typeof LocalAuth;
  };
  export default whatsapp;
}
declare module "qrcode-terminal";
declare module "qrcode";

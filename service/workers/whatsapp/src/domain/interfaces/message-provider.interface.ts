export interface MessageProvider {
  initialize(senderId: string, sessionKey: string): Promise<void>;
  sendMessage(senderId: string, to: string, message: string): Promise<void>;
  onQr?(senderId: string, callback: (qr: string) => void): void;
  onReady?(senderId: string, callback: (phoneNumber: string | null) => void): void;
  onDisconnect?(senderId: string, callback: () => void): void;
  clear?(senderId: string, destroyAuth?: boolean): Promise<void> | void;
  listSenderIds?(): string[];
  getSessionKey?(senderId: string): string | null;
  getState?(senderId: string): Promise<string | null>;
}

export interface MessageProvider {
  initialize(senderId: string): Promise<void>;
  sendMessage(senderId: string, to: string, message: string): Promise<void>;
  onQr?(senderId: string, callback: (qr: string) => void): void;
  onReady?(senderId: string, callback: (phoneNumber: string | null) => void): void;
  onDisconnect?(senderId: string, callback: () => void): void;
  clear?(senderId: string): Promise<void> | void;
  listSenderIds?(): string[];
  getState?(senderId: string): Promise<string | null>;
}

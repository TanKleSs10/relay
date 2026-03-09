export interface MessageProvider {
  initialize(senderId: number): Promise<void>;
  sendMessage(senderId: number, to: string, message: string): Promise<void>;
  onQr?(senderId: number, callback: (qr: string) => void): void;
  onReady?(senderId: number, callback: (phoneNumber: string | null) => void): void;
  onDisconnect?(senderId: number, callback: () => void): void;
  clear?(senderId: number): Promise<void> | void;
  listSenderIds?(): number[];
  getState?(senderId: number): Promise<string | null>;
}

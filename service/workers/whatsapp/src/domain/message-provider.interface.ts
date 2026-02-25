export interface MessageProvider {
  initialize(senderId: number): Promise<void>;
  sendMessage(senderId: number, to: string, message: string): Promise<void>;
  onQr?(senderId: number, callback: (qr: string) => void): void;
  onReady?(senderId: number, callback: (phoneNumber: string | null) => void): void;
  onDisconnect?(senderId: number, callback: () => void): void;
}

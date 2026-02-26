import type { MessageProvider } from "../domain/message-provider.interface";

export class MessageService {
  private provider: MessageProvider;

  constructor(provider: MessageProvider) {
    this.provider = provider;
  }

  async send(senderId: number, to: string, message: string): Promise<void> {
    await this.provider.sendMessage(senderId, to, message);
  }
}

import type { MessageProvider } from "../../domain/interfaces/message-provider.interface";

import { WhatsAppProvider } from "./whatsapp.provider";

export function createMessageProvider(): MessageProvider {
  return new WhatsAppProvider();
}

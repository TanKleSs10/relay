import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";

import { WhatsAppProvider } from "./whatsapp.provider.js";

export function createMessageProvider(): MessageProvider {
  return new WhatsAppProvider();
}

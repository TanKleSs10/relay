import type { MessageProvider } from "../../domain/message-provider.interface";

import { WhatsAppWebProvider } from "./whatsapp-web.provider";

export function createMessageProvider(): MessageProvider {
  return new WhatsAppWebProvider();
}

import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import type { WorkerEventBus } from "../../utils/worker-events.js";

import { WhatsAppProvider } from "./whatsapp.provider.js";

export function createMessageProvider(eventBus: WorkerEventBus): MessageProvider {
  return new WhatsAppProvider(eventBus);
}

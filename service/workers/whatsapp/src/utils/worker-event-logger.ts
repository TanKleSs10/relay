import type { Logger } from "./logger.js";
import type { WorkerEventBus, WorkerEvent } from "./worker-events.js";

export function attachWorkerEventLogger(
  eventBus: WorkerEventBus,
  logger: Logger
): void {
  eventBus.onEvent((event) => {
    const message = formatEvent(event);
    if (event.type.endsWith(".failed") || event.type.startsWith("worker.")) {
      logger.error(message, event.payload.error);
      return;
    }
    if (
      event.type === "sender.disconnected" ||
      event.type === "sender.auth_failure" ||
      event.type === "sender.state.unknown" ||
      event.type === "sender.state.degraded"
    ) {
      logger.warn(message);
      return;
    }
    logger.info(message);
  });
}

function formatEvent(event: WorkerEvent): string {
  if (!("senderId" in event.payload)) {
    return `${event.type}`;
  }

  const {
    senderId,
    sessionKey,
    recipient,
    state,
    reason,
    category,
    attempts,
    threshold,
  } =
    event.payload;
  const parts = [
    event.type,
    senderId ? `sender=${senderId}` : null,
    sessionKey ? `session=${sessionKey}` : null,
    recipient ? `recipient=${recipient}` : null,
    state ? `state=${state}` : null,
    reason ? `reason=${reason}` : null,
    category ? `category=${category}` : null,
    attempts ? `attempts=${attempts}` : null,
    threshold ? `threshold=${threshold}` : null,
  ].filter(Boolean);
  return parts.join(" ");
}

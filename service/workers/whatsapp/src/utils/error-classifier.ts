export type WorkerErrorCategory =
  | "execution_context_destroyed"
  | "target_closed"
  | "auth_invalid"
  | "profile_lock"
  | "recipient_unresolved"
  | "timeout"
  | "not_initialized"
  | "protocol"
  | "unknown";

export function classifyWorkerError(error: unknown): WorkerErrorCategory {
  const message = getErrorMessage(error).toLowerCase();
  if (
    message.includes("profile appears to be in use") ||
    message.includes("chromium has locked the profile") ||
    message.includes("process_singleton_posix")
  ) {
    return "profile_lock";
  }
  if (message.includes("execution context was destroyed")) {
    return "execution_context_destroyed";
  }
  if (message.includes("target closed")) {
    return "target_closed";
  }
  if (
    message.includes("no lid for user") ||
    message.includes("not a whatsapp user") ||
    message.includes("not registered") ||
    message.includes("recipient is not registered") ||
    message.includes("invalid number") ||
    message.includes("invalid jid") ||
    message.includes("wid error") ||
    message.includes("jid error")
  ) {
    return "recipient_unresolved";
  }
  if (
    message.includes("auth failure") ||
    message.includes("auth is invalid") ||
    message.includes("session closed") ||
    message.includes("session does not exist")
  ) {
    return "auth_invalid";
  }
  if (message.includes("timeout")) {
    return "timeout";
  }
  if (message.includes("not initialized") || message.includes("is initializing")) {
    return "not_initialized";
  }
  if (message.includes("protocol error")) {
    return "protocol";
  }
  return "unknown";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

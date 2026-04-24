export type WorkerErrorCategory =
  | "navigation"
  | "target_closed"
  | "auth_corrupt"
  | "timeout"
  | "not_initialized"
  | "protocol"
  | "unknown";

export function classifyWorkerError(error: unknown): WorkerErrorCategory {
  const message = getErrorMessage(error).toLowerCase();
  if (message.includes("execution context was destroyed")) {
    return "navigation";
  }
  if (message.includes("target closed")) {
    return "target_closed";
  }
  if (message.includes("auth failure")) {
    return "auth_corrupt";
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


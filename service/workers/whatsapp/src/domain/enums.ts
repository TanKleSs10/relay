export enum Provider {
  WHATSAPP_WEB = "WHATSAPP_WEB",
}

export enum CampaignStatus {
  CREATED = "CREATED",
  QUEUED = "QUEUED",
  PROCESSING = "PROCESSING",
  DONE = "DONE",
  FAILED = "FAILED",
}

export enum MessageStatus {
  QUEUED = "QUEUED",
  SENT = "SENT",
  FAILED = "FAILED",
  RETRY = "RETRY",
}

export enum SenderAccountStatus {
  QR_REQUIRED = "QR_REQUIRED",
  READY = "READY",
  COOLDOWN = "COOLDOWN",
  BLOCKED = "BLOCKED",
}

export enum WorkerStatus {
  IDLE = "IDLE",
  RUNNING = "RUNNING",
  ERROR = "ERROR",
}

export enum Provider {
  WHATSAPP_WEB = "WHATSAPP_WEB",
}

export enum CampaignStatus {
  CREATED = "CREATED",
  ACTIVE = "ACTIVE",
  PAUSED = "PAUSED",
  FINISHED = "FINISHED",
}

export enum MessageStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SENT = "SENT",
  FAILED = "FAILED",
}

export enum SenderAccountStatus {
  CREATED = "CREATED",
  INITIALIZING = "INITIALIZING",
  WAITING_QR = "WAITING_QR",
  CONNECTED = "CONNECTED",
  SENDING = "SENDING",
  COOLDOWN = "COOLDOWN",
  DISCONNECTED = "DISCONNECTED",
  BLOCKED = "BLOCKED",
  ERROR = "ERROR",
}

export enum WorkerStatus {
  ONLINE = "ONLINE",
  OFFLINE = "OFFLINE",
}

export enum WorkerType {
  QR = "qr",
  SESSION = "session",
  CAMPAIGN = "campaign",
}

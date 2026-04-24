import { SenderAccountStatus } from "./enums/index.js";

const QR_REQUIRED_PROVIDER_STATES = new Set(["UNPAIRED", "UNPAIRED_IDLE", "CONFLICT"]);

export function shouldSyncProviderState(status: SenderAccountStatus): boolean {
  return [
    SenderAccountStatus.CONNECTED,
    SenderAccountStatus.SENDING,
    SenderAccountStatus.AUTHENTICATING,
    SenderAccountStatus.CONNECTING,
  ].includes(status);
}

export function mapProviderStateToSenderStatus(
  providerState: string,
  currentStatus: SenderAccountStatus
): SenderAccountStatus {
  const normalized = providerState.trim().toUpperCase();

  if (normalized === "CONNECTED") {
    return SenderAccountStatus.CONNECTED;
  }

  if (normalized === "PAIRING") {
    return SenderAccountStatus.AUTHENTICATING;
  }

  if (normalized === "OPENING") {
    return SenderAccountStatus.CONNECTING;
  }

  if (QR_REQUIRED_PROVIDER_STATES.has(normalized)) {
    return SenderAccountStatus.WAITING_QR;
  }

  if (
    currentStatus === SenderAccountStatus.AUTHENTICATING &&
    normalized === "TIMEOUT"
  ) {
    return SenderAccountStatus.AUTHENTICATING;
  }

  if (
    currentStatus === SenderAccountStatus.CONNECTING &&
    normalized === "TIMEOUT"
  ) {
    return SenderAccountStatus.CONNECTING;
  }

  return SenderAccountStatus.DISCONNECTED;
}

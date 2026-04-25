import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import type { SenderEntity } from "../../domain/entities/sender.entity.js";
import {
  mapProviderStateToSenderStatus,
  shouldSyncProviderState,
} from "../../domain/sender-state-machine.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { SenderLifecycleManager } from "./sender-lifecycle.manager.js";
import { CampaignRepository } from "../../infrastructure/repositories/campaign.repository.js";
import { removeAuthSession } from "../../utils/auth.js";
import type { Logger } from "../../utils/logger.js";
import type { SenderRetryController } from "../../utils/sender-retry-controller.js";
import type { WorkerEventBus } from "../../utils/worker-events.js";

const INITIALIZING_TIMEOUT_MS = 90_000;
const ERROR_RECOVERY_DELAY_MS = 30_000;
const IDLE_TIMEOUT_MS = 10 * 60_000;
const POST_SEND_KEEPALIVE_MS = 5 * 60_000;
const QR_ACTIVE_TIMEOUT_MS = 3 * 60_000;
const IDLE_CONNECTED_CHECK_INTERVAL_MS = 120_000;
const ACTIVE_CONNECTED_CHECK_INTERVAL_MS = 30_000;
const SENDING_CHECK_INTERVAL_MS = 15_000;
const TRANSITION_CHECK_INTERVAL_MS = 10_000;
const IDLE_UNKNOWN_STATE_THRESHOLD = 5;
const ACTIVE_UNKNOWN_STATE_THRESHOLD = 3;
const IDLE_MAX_STATE_CHECKS_PER_TICK = 1;
const ACTIVE_MAX_STATE_CHECKS_PER_TICK = 2;

export class SessionManager {
  private unknownStateCounts = new Map<string, number>();
  private lastStateCheckAt = new Map<string, number>();

  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private lifecycleManager: SenderLifecycleManager,
    private campaignRepository: CampaignRepository,
    private logger: Logger,
    private retryController: SenderRetryController,
    private eventBus?: WorkerEventBus
  ) {}

  async tick(): Promise<void> {
    const senders = await this.senderRepository.listAll();
    const hasActiveCampaign =
      (await this.campaignRepository.getActiveCampaignId()) !== null;
    await this.cleanupMissingSenders(senders);
    await this.syncSessions(senders, hasActiveCampaign);
  }

  private async cleanupMissingSenders(senders: SenderEntity[]): Promise<void> {
    const providerIds = new Set(this.provider.listSenderIds?.() ?? []);
    const dbIds = new Set(senders.map((sender) => sender.id));

    for (const senderId of providerIds) {
      if (!dbIds.has(senderId)) {
        this.logger.warn(`session for sender ${senderId} missing in DB. cleaning up`);
        await this.provider.clear?.(senderId, true);
        this.unknownStateCounts.delete(senderId);
        this.lastStateCheckAt.delete(senderId);
      }
    }
  }

  private async syncSessions(
    senders: SenderEntity[],
    hasActiveCampaign: boolean
  ): Promise<void> {
    let stateChecksThisTick = 0;
    const maxStateChecks = hasActiveCampaign
      ? ACTIVE_MAX_STATE_CHECKS_PER_TICK
      : IDLE_MAX_STATE_CHECKS_PER_TICK;

    for (const sender of senders) {
      if (sender.status === SenderAccountStatus.WAITING_QR) {
        if (isQrExpired(sender)) {
          this.logger.info(`sender ${sender.id} -> QR_INACTIVE (qr timeout)`);
          await this.provider.clear?.(sender.id, false);
          await this.senderRepository.markQrInactive(sender.id);
        }
        continue;
      }

      if (
        sender.status === SenderAccountStatus.CONNECTED &&
        !hasActiveCampaign &&
        this.shouldTransitionToIdle(sender)
      ) {
        this.logger.info(`sender ${sender.id} -> IDLE (inactive)`);
        await this.provider.clear?.(sender.id, false);
        await this.senderRepository.updateStatus(sender.id, SenderAccountStatus.IDLE);
        this.resetUnknownState(sender.id);
        this.lastStateCheckAt.delete(sender.id);
        continue;
      }

      if (shouldSyncProviderState(sender.status)) {
        if (
          stateChecksThisTick >= maxStateChecks ||
          !this.shouldCheckState(sender, hasActiveCampaign)
        ) {
          continue;
        }

        stateChecksThisTick += 1;
        this.lastStateCheckAt.set(sender.id, Date.now());
        const state = await this.provider.getState?.(sender.id);
        if (!state) {
          await this.handleUnknownState(sender, hasActiveCampaign);
          continue;
        }

        this.resetUnknownState(sender.id);
        const nextStatus = mapProviderStateToSenderStatus(state, sender.status);

        if (nextStatus === sender.status) {
          continue;
        }

        if (nextStatus === SenderAccountStatus.WAITING_QR) {
          this.logger.warn(`sender ${sender.id} -> QR_INACTIVE (${state})`);
          await this.provider.clear?.(sender.id);
          await this.senderRepository.markQrInactive(sender.id);
          await cleanupAuthState(sender.sessionKey, this.logger);
          continue;
        }

        if (nextStatus === SenderAccountStatus.DISCONNECTED) {
          this.logger.warn(`sender ${sender.id} -> DISCONNECTED (${state})`);
          await this.senderRepository.updateStatus(sender.id, nextStatus);
          continue;
        }

        if (nextStatus === SenderAccountStatus.CONNECTED) {
          this.retryController.recordSuccess(sender.id);
        }
        this.logger.info(`sender ${sender.id} -> ${nextStatus} (${state})`);
        await this.senderRepository.updateStatus(sender.id, nextStatus);
        continue;
      }

      if (sender.status === SenderAccountStatus.INITIALIZING) {
        if (isInitializingTimedOut(sender)) {
          const retryState = this.retryController.recordFailure(
            sender.id,
            sender.sessionKey
          );
          this.logger.warn(
            `sender ${sender.id} initialization timed out after ${Math.round(
              INITIALIZING_TIMEOUT_MS / 1000
            )}s; retry in ${Math.ceil(
              (retryState.nextRetryAt - Date.now()) / 1000
            )}s`
          );
          await this.provider.clear?.(sender.id, false);
          await this.senderRepository.updateStatus(
            sender.id,
            SenderAccountStatus.ERROR
          );
        }
        continue;
      }

      this.resetUnknownState(sender.id);

      if (sender.status === SenderAccountStatus.IDLE) {
        continue;
      }

      if (sender.status === SenderAccountStatus.ERROR) {
        if (
          !hasErrorRecoveryDelayElapsed(sender) ||
          !this.retryController.canAttempt(sender.id, sender.sessionKey)
        ) {
          continue;
        }
        this.logger.info(`sender ${sender.id} leaving ERROR -> DISCONNECTED`);
        await this.senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.DISCONNECTED
        );
        continue;
      }

      if (sender.status === SenderAccountStatus.DISCONNECTED) {
        if (!this.retryController.canAttempt(sender.id, sender.sessionKey)) {
          continue;
        }
        this.logger.info(`sender ${sender.id} reinitializing`);
        this.lifecycleManager.ensureRegistered(sender.id);
        await this.senderRepository.updateStatus(
          sender.id,
          SenderAccountStatus.INITIALIZING
        );
        try {
          await this.provider.initialize(sender.id, sender.sessionKey);
        } catch (error) {
          const retryState = this.retryController.recordFailure(
            sender.id,
            sender.sessionKey
          );
          this.logger.error(`failed to reinitialize sender ${sender.id}`, error);
          this.logger.warn(
            `sender ${sender.id} scheduled for retry in ${Math.ceil(
              (retryState.nextRetryAt - Date.now()) / 1000
            )}s after ${retryState.failures} init failures`
          );
          await this.senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
        }
      }
    }
  }

  private async handleUnknownState(
    sender: SenderEntity,
    hasActiveCampaign: boolean
  ): Promise<void> {
    const threshold = hasActiveCampaign
      ? ACTIVE_UNKNOWN_STATE_THRESHOLD
      : IDLE_UNKNOWN_STATE_THRESHOLD;
    const attempts = (this.unknownStateCounts.get(sender.id) ?? 0) + 1;
    this.unknownStateCounts.set(sender.id, attempts);

    this.eventBus?.emit({
      type: "sender.state.unknown",
      payload: {
        senderId: sender.id,
        sessionKey: sender.sessionKey,
        state: sender.status,
        attempts,
        threshold,
      },
    });

    if (attempts < threshold) {
      this.logger.warn(
        `sender ${sender.id} state unknown (${attempts}/${threshold}); waiting before degrading`
      );
      return;
    }

    this.logger.warn(
      `sender ${sender.id} state unknown threshold reached; clearing client and marking DISCONNECTED`
    );
    this.eventBus?.emit({
      type: "sender.state.degraded",
      payload: {
        senderId: sender.id,
        sessionKey: sender.sessionKey,
        state: sender.status,
        attempts,
        threshold,
        reason: "unknown_state_threshold_reached",
      },
    });
    await this.provider.clear?.(sender.id, false);
    await this.senderRepository.updateStatus(
      sender.id,
      SenderAccountStatus.DISCONNECTED
    );
    this.unknownStateCounts.delete(sender.id);
  }

  private resetUnknownState(senderId: string): void {
    this.unknownStateCounts.delete(senderId);
  }

  private shouldCheckState(
    sender: SenderEntity,
    hasActiveCampaign: boolean
  ): boolean {
    const lastCheckAt = this.lastStateCheckAt.get(sender.id) ?? 0;
    const interval = getStateCheckInterval(sender.status, hasActiveCampaign);
    return Date.now() - lastCheckAt >= interval;
  }

  private shouldTransitionToIdle(sender: SenderEntity): boolean {
    if (!this.provider.listSenderIds?.().includes(sender.id)) {
      return false;
    }

    if (
      sender.lastSentAt &&
      Date.now() - sender.lastSentAt.getTime() < POST_SEND_KEEPALIVE_MS
    ) {
      return false;
    }

    const lastActivityAt = getLastActivityAt(sender);

    return Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS;
  }
}

async function cleanupAuthState(sessionKey: string, logger: Logger): Promise<void> {
  try {
    await removeAuthSession(sessionKey);
  } catch (error) {
    logger.warn(`failed to clean auth state for session ${sessionKey}`);
    if (error) {
      logger.error("cleanup error", error);
    }
  }
}

function isInitializingTimedOut(sender: SenderEntity): boolean {
  return Date.now() - sender.updatedAt.getTime() >= INITIALIZING_TIMEOUT_MS;
}

function isQrExpired(sender: SenderEntity): boolean {
  const qrStartedAt = sender.qrGeneratedAt ?? sender.updatedAt;
  return Date.now() - qrStartedAt.getTime() >= QR_ACTIVE_TIMEOUT_MS;
}

function getLastActivityAt(sender: SenderEntity): number {
  return Math.max(
    sender.lastSentAt?.getTime() ?? 0,
    sender.lastSeenAt?.getTime() ?? 0,
    sender.updatedAt.getTime()
  );
}

function hasErrorRecoveryDelayElapsed(sender: SenderEntity): boolean {
  return Date.now() - sender.updatedAt.getTime() >= ERROR_RECOVERY_DELAY_MS;
}

function getStateCheckInterval(
  status: SenderAccountStatus,
  hasActiveCampaign: boolean
): number {
  if (status === SenderAccountStatus.SENDING) {
    return SENDING_CHECK_INTERVAL_MS;
  }
  if (
    status === SenderAccountStatus.AUTHENTICATING ||
    status === SenderAccountStatus.CONNECTING
  ) {
    return TRANSITION_CHECK_INTERVAL_MS;
  }
  return hasActiveCampaign
    ? ACTIVE_CONNECTED_CHECK_INTERVAL_MS
    : IDLE_CONNECTED_CHECK_INTERVAL_MS;
}

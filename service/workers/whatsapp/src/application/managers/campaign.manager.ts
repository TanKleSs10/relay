import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { SenderLifecycleManager } from "./sender-lifecycle.manager.js";
import { CampaignRepository } from "../../infrastructure/repositories/campaign.repository.js";
import {
  MessageRepository,
  type MessageRow,
} from "../../infrastructure/repositories/message.repository.js";
import { SendLogRepository } from "../../infrastructure/repositories/send-log.repository.js";
import { randomDelay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";
import type { SenderRetryController } from "../../utils/sender-retry-controller.js";

const DISPATCH_LIMITS = {
  maxMessagesPerTick: 12,
  maxPerSenderPerTick: 1,
  lowQueueThreshold: 50,
} as const;
const TEXT_DELAY_PROFILES = {
  fast: { min: 150, max: 400 },
  medium: { min: 300, max: 700 },
  slow: { min: 500, max: 1200 },
} as const;
const WARMUP_DELAY_MULTIPLIERS = [2.2, 1.7, 1.3] as const;
const SOFT_COOLDOWN = {
  everyMessages: 5,
  minMs: 1_500,
  maxMs: 3_000,
} as const;
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_INIT_RETRIES = 3;
const PROCESSING_LOCK_WINDOW_MIN = 5;
const MAX_IDLE_WAKEUPS_PER_TICK = 1;
const MAX_LIVE_SESSIONS = 1;
const LIVE_SESSION_LIMIT_LOG_INTERVAL_MS = 15_000;

export class CampaignManager {
  private failureStreaks = new Map<string, number>();
  private cachedCampaignId: string | null = null;
  private cachedQueue: MessageRow[] = [];
  private roundRobinIndex = 0;
  private sentKeys = new Set<string>();
  private lastNoActiveLogAt = 0;
  private lastLiveLimitLogAt = 0;
  private senderTotals = new Map<string, number>();

  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private lifecycleManager: SenderLifecycleManager,
    private messageRepository: MessageRepository,
    private campaignRepository: CampaignRepository,
    private logger: Logger,
    private workerId: string,
    private sendLogRepository: SendLogRepository,
    private retryController: SenderRetryController
  ) {}

  async finishActiveCampaign(): Promise<void> {
    const campaignId = await this.campaignRepository.getActiveCampaignId();
    if (!campaignId) {
      return;
    }
    this.logger.warn(`marking campaign ${campaignId} FINISHED due to worker failure`);
    await this.campaignRepository.markDone(campaignId);
  }

  async dispatchOnce(): Promise<void> {
    try {
      const campaignId = await this.campaignRepository.getActiveCampaignId();
      if (!campaignId) {
        const now = Date.now();
        if (now - this.lastNoActiveLogAt > 10_000) {
          this.logger.info("dispatch skip: no ACTIVE campaign");
          this.lastNoActiveLogAt = now;
        }
        return;
      }

      if (this.cachedCampaignId !== campaignId) {
        this.cachedCampaignId = campaignId;
        this.cachedQueue = [];
        this.roundRobinIndex = 0;
        this.sentKeys.clear();
        this.senderTotals.clear();
      }

      const queuedCount = await this.messageRepository.countQueuedByCampaign(
        campaignId
      );
      const processingCount = await this.messageRepository.countProcessingByCampaign(
        campaignId
      );

      if (this.cachedQueue.length === 0 && queuedCount === 0) {
        this.logger.info(
          `dispatch skip: no queued messages for campaign ${campaignId}`
        );
        await this.completeCampaign(campaignId);
        return;
      }

      const wokenIdleSenders = await this.wakeIdleSenders(campaignId);
      const senders = await this.senderRepository.listByStatus(
        SenderAccountStatus.CONNECTED
      );
      if (!senders.length) {
        if (wokenIdleSenders > 0) {
          this.logger.info(
            `dispatch waiting: ${wokenIdleSenders} IDLE senders waking up for campaign ${campaignId}`
          );
          return;
        }
        this.logger.warn(
          `dispatch skip: no CONNECTED or IDLE senders ready for campaign ${campaignId}`
        );
        return;
      }
      this.logger.info(
        `campaign ${campaignId} state: queued=${queuedCount}, processing=${processingCount}, senders_ready=${senders.length}`
      );

      if (this.cachedQueue.length === 0) {
        this.cachedQueue = await this.messageRepository.claimNextBatch(
          campaignId,
          this.workerId,
          DISPATCH_LIMITS.maxMessagesPerTick
        );
        this.logger.info(
          `reserved ${this.cachedQueue.length} queued messages for campaign ${campaignId}`
        );
      }

      const senderLimit =
        Math.max(1, senders.length) * DISPATCH_LIMITS.maxPerSenderPerTick;
      const allowedCount = Math.min(this.cachedQueue.length, senderLimit);
      const batch = this.cachedQueue.splice(0, allowedCount);
      this.logger.info(`dispatching ${batch.length} messages for campaign ${campaignId}`);
      this.logger.info(
        `limits: max_per_tick=${DISPATCH_LIMITS.maxMessagesPerTick}, max_per_sender=${DISPATCH_LIMITS.maxPerSenderPerTick}, senders_ready=${senders.length}, queued_batch=${batch.length}`
      );
      const baseDelayRange = pickTextDelayRange(
        batch.length,
        senders.length,
        DISPATCH_LIMITS.lowQueueThreshold
      );
      this.logger.info(
        `delay profile: type=text base_range=${baseDelayRange.min}-${baseDelayRange.max}ms`
      );
      const perSenderCount = new Map<string, number>();
      for (const message of batch) {
        const sender = pickSenderBalanced(
          senders,
          perSenderCount,
          this.senderTotals,
          DISPATCH_LIMITS.maxPerSenderPerTick,
          this.roundRobinIndex
        );
        if (!sender) {
          this.logger.warn("dispatch stopped: no available senders for this tick");
          break;
        }
        this.roundRobinIndex =
          (this.roundRobinIndex + 1) % Math.max(1, senders.length);
        this.senderTotals.set(
          sender.id,
          (this.senderTotals.get(sender.id) ?? 0) + 1
        );
        const normalizedRecipient = normalizeRecipientForDedup(message.recipient);
        const dedupeKey = message.idempotency_key ?? normalizedRecipient;
        if (this.sentKeys.has(dedupeKey)) {
          await this.messageRepository.markFailed(
            message.id,
            "duplicate recipient content in campaign",
            sender.id
          );
          await this.sendLogRepository.create({
            messageId: message.id,
            campaignId: message.campaign_id,
            senderId: sender.id,
            workerId: this.workerId,
            status: "FAILED",
            errorMessage: "duplicate recipient content in campaign",
          });
          this.logger.warn(
            `skip duplicate message for recipient ${message.recipient} (id ${message.id})`
          );
          continue;
        }
        const totalSentBeforeSend = this.senderTotals.get(sender.id) ?? 0;
        const warmupStep = getWarmupStep(totalSentBeforeSend);
        const delayRange = applyWarmupMultiplier(baseDelayRange, warmupStep);
        const appliedDelay = await randomDelay(delayRange.min, delayRange.max);
        this.logger.info(
          `delay sender=${sender.id} type=text warmup_step=${warmupStep} applied=${appliedDelay}ms range=${delayRange.min}-${delayRange.max}ms`
        );
        this.logger.info(
          `sending message ${message.id} via sender ${sender.id} to ${message.recipient} type=text`
        );
        const alreadySent = await this.messageRepository.hasSentIdempotency(
          campaignId,
          message.idempotency_key ?? null,
          normalizedRecipient
        );
        if (alreadySent) {
          await this.messageRepository.markFailed(
            message.id,
            "duplicate recipient content already sent",
            sender.id
          );
          await this.sendLogRepository.create({
            messageId: message.id,
            campaignId: message.campaign_id,
            senderId: sender.id,
            workerId: this.workerId,
            status: "FAILED",
            errorMessage: "duplicate recipient content already sent",
          });
          this.logger.warn(
            `skip message ${message.id}; recipient content already sent`
          );
          continue;
        }
        const result = await this.sendWithSender(sender.id, message);
        if (result.sent) {
          this.failureStreaks.set(sender.id, 0);
          this.sentKeys.add(dedupeKey);
          await this.applySoftCooldownIfNeeded(sender.id);
        } else {
          if (result.avoidCooldown) {
            this.failureStreaks.set(sender.id, 0);
            continue;
          }
          const streak = (this.failureStreaks.get(sender.id) ?? 0) + 1;
          this.failureStreaks.set(sender.id, streak);
          if (streak >= MAX_CONSECUTIVE_FAILURES) {
            this.logger.warn(
              `sender ${sender.id} entered COOLDOWN after ${streak} failures (total_sent=${this.senderTotals.get(
                sender.id
              ) ?? 0})`
            );
            try {
              await this.senderRepository.updateStatus(
                sender.id,
                SenderAccountStatus.COOLDOWN
              );
            } catch (error) {
              this.logger.error(
                `failed to set COOLDOWN for sender ${sender.id}`,
                error
              );
            }
          }
        }
      }
      await this.completeCampaign(campaignId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error(`dispatch failed: ${message}`);
    }
  }

  private async sendWithSender(
    senderId: string,
    message: MessageRow
  ): Promise<{ sent: boolean; avoidCooldown: boolean }> {
    try {
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.SENDING
      );
      if (process.env.DRY_RUN === "1") {
        console.log(
          `DRY_RUN: skipping send for message ${message.id} to ${message.recipient} via sender ${senderId}`
        );
        await this.messageRepository.markSent(message.id, senderId);
        await this.sendLogRepository.create({
          messageId: message.id,
          campaignId: message.campaign_id,
          senderId,
          workerId: this.workerId,
          status: "SENT",
        });
        await this.senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.CONNECTED
        );
        return { sent: true, avoidCooldown: false };
      }
      await this.provider.sendMessage(senderId, message.recipient, message.content);
      await this.messageRepository.markSent(message.id, senderId);
      await this.sendLogRepository.create({
        messageId: message.id,
        campaignId: message.campaign_id,
        senderId,
        workerId: this.workerId,
        status: "SENT",
      });
      this.logger.info(`message ${message.id} marked SENT`);
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.CONNECTED
      );
      return { sent: true, avoidCooldown: false };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const recordFailure = async (note: string) => {
        await this.messageRepository.markFailed(message.id, note, senderId);
        await this.sendLogRepository.create({
          messageId: message.id,
          campaignId: message.campaign_id,
          senderId,
          workerId: this.workerId,
          status: "FAILED",
          errorMessage: note,
        });
        this.logger.error(`message ${message.id} failed: ${note}`);
      };
      const normalizedError = errorMessage.toLowerCase();
      if (isNoWaRecipient(normalizedError)) {
        await this.messageRepository.markNoWa(message.id, senderId);
        await this.sendLogRepository.create({
          messageId: message.id,
          campaignId: message.campaign_id,
          senderId,
          workerId: this.workerId,
          status: "NO_WA",
          errorMessage,
        });
        this.logger.warn(
          `message ${message.id} marked NO_WA for recipient ${message.recipient}`
        );
        await this.senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.CONNECTED
        );
        return { sent: false, avoidCooldown: true };
      }
      if (
        normalizedError.includes("execution context was destroyed") ||
        normalizedError.includes("target closed")
      ) {
        await recordFailure(errorMessage);
        await this.messageRepository.markPending(message.id);
        await this.senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.DISCONNECTED
        );
        await this.provider.clear?.(senderId);
        return { sent: false, avoidCooldown: true };
      }
      await recordFailure(errorMessage);
      if (errorMessage.toLowerCase().includes("not initialized")) {
        if ((message.retry_count ?? 0) >= MAX_INIT_RETRIES) {
          this.logger.warn(`message ${message.id} exceeded init retries`);
          await recordFailure("sender not initialized retry limit");
          return { sent: false, avoidCooldown: true };
        }
        this.logger.warn(`sender ${senderId} session reset required`);
        try {
          await this.senderRepository.resetSession(senderId);
          await this.provider.clear?.(senderId);
          await this.messageRepository.markPending(message.id);
        } catch (resetError) {
          this.logger.error(`failed to reset sender ${senderId}`, resetError);
        }
        return { sent: false, avoidCooldown: true };
      }
      if (!(error instanceof Error)) {
        this.logger.error(`message ${message.id} error value:`, error);
      } else if (error.stack) {
        this.logger.error(error.stack);
      }
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.CONNECTED
      );
      return { sent: false, avoidCooldown: false };
    }
  }

  private async completeCampaign(campaignId: string): Promise<void> {
    const remaining = await this.messageRepository.countQueuedByCampaign(
      campaignId
    );
    if (remaining > 0) {
      this.logger.info(
        `campaign ${campaignId} still has ${remaining} queued messages`
      );
      return;
    }
    const processing = await this.messageRepository.countProcessingByCampaign(
      campaignId
    );
    if (processing > 0) {
      const recentLocks = await this.messageRepository.countRecentLocksByCampaign(
        campaignId,
        PROCESSING_LOCK_WINDOW_MIN
      );
      if (recentLocks > 0) {
        this.logger.info(
          `campaign ${campaignId} still has ${processing} processing messages`
        );
        return;
      }
      this.logger.warn(
        `campaign ${campaignId} has ${processing} stale processing messages`
      );
    }
    const failed = await this.messageRepository.countFailedByCampaign(campaignId);
    if (failed > 0) {
      await this.campaignRepository.markPaused(campaignId);
      this.logger.warn(
        `campaign ${campaignId} marked PAUSED with ${failed} failed messages`
      );
    } else {
      await this.campaignRepository.markDone(campaignId);
      this.logger.info(`campaign ${campaignId} marked FINISHED`);
    }
    this.logger.info(`campaign ${campaignId} completed`);
  }

  private async wakeIdleSenders(campaignId: string): Promise<number> {
    const liveSessionCount = this.provider.listSenderIds?.().length ?? 0;
    if (liveSessionCount >= MAX_LIVE_SESSIONS) {
      const now = Date.now();
      if (now - this.lastLiveLimitLogAt >= LIVE_SESSION_LIMIT_LOG_INTERVAL_MS) {
        this.logger.info(
          `campaign ${campaignId} wakeup skip: live session limit reached (${liveSessionCount}/${MAX_LIVE_SESSIONS})`
        );
        this.lastLiveLimitLogAt = now;
      }
      return 0;
    }

    const availableSlots = Math.min(
      MAX_IDLE_WAKEUPS_PER_TICK,
      MAX_LIVE_SESSIONS - liveSessionCount
    );
    if (availableSlots <= 0) {
      return 0;
    }

    const idleSenders = await this.senderRepository.listByStatus(
      SenderAccountStatus.IDLE
    );
    if (!idleSenders.length) {
      return 0;
    }

    let woken = 0;
    for (const sender of idleSenders.slice(0, availableSlots)) {
      if (!this.retryController.canAttempt(sender.id, sender.sessionKey)) {
        continue;
      }

      this.logger.info(
        `waking IDLE sender ${sender.id} for campaign ${campaignId} (${liveSessionCount + woken + 1}/${MAX_LIVE_SESSIONS})`
      );
      this.lifecycleManager.ensureRegistered(sender.id);
      await this.senderRepository.updateStatus(
        sender.id,
        SenderAccountStatus.INITIALIZING
      );

      woken += 1;
      void this.provider.initialize(sender.id, sender.sessionKey).catch(async (error) => {
        const retryState = this.retryController.recordFailure(
          sender.id,
          sender.sessionKey
        );
        this.logger.error(`failed to wake IDLE sender ${sender.id}`, error);
        this.logger.warn(
          `sender ${sender.id} scheduled for retry in ${Math.ceil(
            (retryState.nextRetryAt - Date.now()) / 1000
          )}s after ${retryState.failures} init failures`
        );
        await this.senderRepository.updateStatus(sender.id, SenderAccountStatus.ERROR);
      });
    }

    return woken;
  }

  private async applySoftCooldownIfNeeded(senderId: string): Promise<void> {
    const totalSent = this.senderTotals.get(senderId) ?? 0;
    if (totalSent === 0 || totalSent % SOFT_COOLDOWN.everyMessages !== 0) {
      return;
    }

    const cooldownMs = await randomDelay(
      SOFT_COOLDOWN.minMs,
      SOFT_COOLDOWN.maxMs
    );
    this.logger.info(
      `sender ${senderId} soft cooldown applied=${cooldownMs}ms after total_sent=${totalSent}`
    );
  }
}

function pickSenderBalanced(
  senders: { id: string }[],
  perSenderCount: Map<string, number>,
  senderTotals: Map<string, number>,
  maxPerSender: number,
  startIndex: number
): { id: string } | null {
  if (!senders.length) {
    return null;
  }
  const ordered = [...senders].sort((a, b) => {
    const aTotal = senderTotals.get(a.id) ?? 0;
    const bTotal = senderTotals.get(b.id) ?? 0;
    return aTotal - bTotal;
  });
  for (let offset = 0; offset < ordered.length; offset += 1) {
    const index = (startIndex + offset) % ordered.length;
    const sender = ordered[index];
    if (!sender) {
      continue;
    }
    const current = perSenderCount.get(sender.id) ?? 0;
    if (current < maxPerSender) {
      perSenderCount.set(sender.id, current + 1);
      return sender;
    }
  }
  return null;
}

function normalizeRecipientForDedup(recipient: string): string {
  const digits = recipient.replace(/[^\d]/g, "");
  if (digits.length === 10) {
    return `521${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("52") && !digits.startsWith("521")) {
    return `521${digits.slice(2)}`;
  }
  return digits || recipient;
}

function isNoWaRecipient(error: string): boolean {
  return (
    error.includes("no lid for user") ||
    error.includes("not a whatsapp user") ||
    error.includes("not registered") ||
    error.includes("recipient is not registered") ||
    error.includes("invalid number") ||
    error.includes("invalid jid") ||
    error.includes("wid error") ||
    error.includes("jid error")
  );
}

function pickTextDelayRange(
  batchSize: number,
  senderCount: number,
  lowQueueThreshold: number
): { min: number; max: number } {
  if (batchSize <= senderCount) {
    return TEXT_DELAY_PROFILES.fast;
  }
  if (batchSize <= lowQueueThreshold) {
    return TEXT_DELAY_PROFILES.medium;
  }
  return TEXT_DELAY_PROFILES.slow;
}

function getWarmupStep(totalSentBeforeSend: number): number {
  return Math.min(totalSentBeforeSend, WARMUP_DELAY_MULTIPLIERS.length - 1);
}

function applyWarmupMultiplier(
  range: { min: number; max: number },
  warmupStep: number
): { min: number; max: number } {
  const multiplier = WARMUP_DELAY_MULTIPLIERS[warmupStep] ?? 1;
  return {
    min: Math.round(range.min * multiplier),
    max: Math.round(range.max * multiplier),
  };
}

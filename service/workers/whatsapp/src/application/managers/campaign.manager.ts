import type { MessageProvider } from "../../domain/interfaces/message-provider.interface.js";
import { SenderAccountStatus } from "../../domain/enums/index.js";
import type { SenderRepository } from "../../domain/interfaces/sender.repository.interface.js";
import { CampaignRepository } from "../../infrastructure/repositories/campaign.repository.js";
import {
  MessageRepository,
  type MessageRow,
} from "../../infrastructure/repositories/message.repository.js";
import { SendLogRepository } from "../../infrastructure/repositories/send-log.repository.js";
import { randomDelay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";

const MAX_MESSAGES_PER_TICK = 12;
const MAX_PER_SENDER_PER_TICK = 1;
const LOW_QUEUE_THRESHOLD = 50;
const FAST_DELAY_RANGE = { min: 150, max: 400 };
const MEDIUM_DELAY_RANGE = { min: 300, max: 700 };
const SLOW_DELAY_RANGE = { min: 500, max: 1200 };
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_INIT_RETRIES = 3;
const PROCESSING_LOCK_WINDOW_MIN = 5;

export class CampaignManager {
  private failureStreaks = new Map<string, number>();
  private cachedCampaignId: string | null = null;
  private cachedQueue: MessageRow[] = [];
  private roundRobinIndex = 0;
  private sentKeys = new Set<string>();
  private lastNoActiveLogAt = 0;
  private senderTotals = new Map<string, number>();

  constructor(
    private provider: MessageProvider,
    private senderRepository: SenderRepository,
    private messageRepository: MessageRepository,
    private campaignRepository: CampaignRepository,
    private logger: Logger,
    private workerId: string,
    private sendLogRepository: SendLogRepository
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

      const senders = await this.senderRepository.listByStatus(
        SenderAccountStatus.CONNECTED
      );
      if (!senders.length) {
        this.logger.warn(
          `dispatch skip: no CONNECTED senders for campaign ${campaignId}`
        );
        return;
      }
      const queuedCount = await this.messageRepository.countQueuedByCampaign(
        campaignId
      );
      const processingCount = await this.messageRepository.countProcessingByCampaign(
        campaignId
      );
      this.logger.info(
        `campaign ${campaignId} state: queued=${queuedCount}, processing=${processingCount}, senders_ready=${senders.length}`
      );

      if (this.cachedQueue.length === 0) {
        this.cachedQueue = await this.messageRepository.claimNextBatch(
          campaignId,
          this.workerId,
          MAX_MESSAGES_PER_TICK
        );
        this.logger.info(
          `reserved ${this.cachedQueue.length} queued messages for campaign ${campaignId}`
        );
        if (!this.cachedQueue.length) {
          this.logger.info(
            `dispatch skip: no queued messages for campaign ${campaignId}`
          );
          await this.completeCampaign(campaignId);
          return;
        }
      }

      const senderLimit = Math.max(1, senders.length) * MAX_PER_SENDER_PER_TICK;
      const allowedCount = Math.min(this.cachedQueue.length, senderLimit);
      const batch = this.cachedQueue.splice(0, allowedCount);
      this.logger.info(`dispatching ${batch.length} messages for campaign ${campaignId}`);
      this.logger.info(
        `limits: max_per_tick=${MAX_MESSAGES_PER_TICK}, max_per_sender=${MAX_PER_SENDER_PER_TICK}, senders_ready=${senders.length}, queued_batch=${batch.length}`
      );
      const delayRange = pickDelayRange(
        batch.length,
        senders.length,
        LOW_QUEUE_THRESHOLD
      );
      this.logger.info(
        `delay range: ${delayRange.min}-${delayRange.max}ms`
      );
      const perSenderCount = new Map<string, number>();
      for (const message of batch) {
        const sender = pickSenderBalanced(
          senders,
          perSenderCount,
          this.senderTotals,
          MAX_PER_SENDER_PER_TICK,
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
        await randomDelay(delayRange.min, delayRange.max);
        this.logger.info(
          `sending message ${message.id} via sender ${sender.id} to ${message.recipient}`
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

function pickDelayRange(
  batchSize: number,
  senderCount: number,
  lowQueueThreshold: number
): { min: number; max: number } {
  if (batchSize <= lowQueueThreshold && senderCount >= 3) {
    return FAST_DELAY_RANGE;
  }
  if (senderCount <= 1) {
    return SLOW_DELAY_RANGE;
  }
  return MEDIUM_DELAY_RANGE;
}

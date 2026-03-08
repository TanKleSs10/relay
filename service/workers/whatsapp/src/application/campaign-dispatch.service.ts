import type { MessageProvider } from "../domain/message-provider.interface";
import { SenderAccountStatus } from "../domain/enums";
import type { SenderAccountRepository } from "../domain/sender-account.repository.interface";
import { CampaignRepository } from "../infrastructure/repositories/campaign.repository";
import { MessageRepository, type MessageRow } from "../infrastructure/repositories/message.repository";

const MAX_MESSAGES_PER_TICK = 12;
const MAX_PER_SENDER_PER_TICK = 1;
const LOW_QUEUE_THRESHOLD = 50;
const FAST_DELAY_RANGE = { min: 150, max: 400 };
const SLOW_DELAY_RANGE = { min: 400, max: 900 };
const MAX_CONSECUTIVE_FAILURES = 3;

export class CampaignDispatchService {
  private provider: MessageProvider;
  private senderRepository: SenderAccountRepository;
  private campaignRepository: CampaignRepository;
  private messageRepository: MessageRepository;
  private failureStreaks = new Map<number, number>();
  private cachedCampaignId: number | null = null;
  private cachedQueue: MessageRow[] = [];
  private roundRobinIndex = 0;
  private sentRecipients = new Set<string>();

  constructor(
    provider: MessageProvider,
    senderRepository: SenderAccountRepository,
    messageRepository: MessageRepository,
    campaignRepository: CampaignRepository
  ) {
    this.provider = provider;
    this.senderRepository = senderRepository;
    this.messageRepository = messageRepository;
    this.campaignRepository = campaignRepository;
  }

  async dispatchOnce(): Promise<void> {
    try {
      const campaignId = await this.campaignRepository.getActiveCampaignId();
      if (!campaignId) {
        console.log("Dispatch skip: no ACTIVE campaign");
        return;
      }

      if (this.cachedCampaignId !== campaignId) {
        this.cachedCampaignId = campaignId;
        this.cachedQueue = [];
        this.roundRobinIndex = 0;
        this.sentRecipients.clear();
      }

      const senders = await this.senderRepository.listByStatus(
        SenderAccountStatus.CONNECTED
      );
      if (!senders.length) {
        console.log(
          `Dispatch skip: no CONNECTED senders for campaign ${worker.currentCampaignId}`
        );
        return;
      }

      if (this.cachedQueue.length === 0) {
        this.cachedQueue = await this.messageRepository.reserveQueuedByCampaign(
          campaignId,
          MAX_MESSAGES_PER_TICK
        );
        console.log(
          `Reserved ${this.cachedQueue.length} queued messages for campaign ${campaignId}`
        );
        if (!this.cachedQueue.length) {
          console.log(
            `Dispatch skip: no queued messages for campaign ${campaignId}`
          );
          await this.completeCampaign(campaignId);
          return;
        }
      }

      const senderLimit = Math.max(1, senders.length) * MAX_PER_SENDER_PER_TICK;
      const allowedCount = Math.min(this.cachedQueue.length, senderLimit);
      const batch = this.cachedQueue.splice(0, allowedCount);
      console.log(
        `Dispatching ${batch.length} messages for campaign ${campaignId}`
      );
      console.log(
        `Dispatch limits: max_per_tick=${MAX_MESSAGES_PER_TICK}, max_per_sender=${MAX_PER_SENDER_PER_TICK}, senders_ready=${senders.length}, queued_batch=${batch.length}`
      );
      const delayRange =
        batch.length <= LOW_QUEUE_THRESHOLD
          ? FAST_DELAY_RANGE
          : SLOW_DELAY_RANGE;
      console.log(
        `Dispatch delay range: ${delayRange.min}-${delayRange.max}ms`
      );
      const perSenderCount = new Map<number, number>();
      for (const message of batch) {
        const normalizedRecipient = normalizeRecipientForDedup(message.recipient);
        if (this.sentRecipients.has(normalizedRecipient)) {
          await this.messageRepository.markFailed(
            message.id,
            "duplicate recipient in campaign"
          );
          console.warn(
            `Skipping duplicate recipient ${message.recipient} for message ${message.id}`
          );
          continue;
        }
        const sender = pickSender(
          senders,
          perSenderCount,
          MAX_PER_SENDER_PER_TICK,
          this.roundRobinIndex
        );
        if (!sender) {
          console.warn("Dispatch stopped: no available senders for this tick");
          break;
        }
        this.roundRobinIndex =
          (this.roundRobinIndex + 1) % Math.max(1, senders.length);
        await sleep(randomInt(delayRange.min, delayRange.max));
        console.log(
          `Sending message ${message.id} via sender ${sender.id} to ${message.recipient}`
        );
        const normalizedRecipient = normalizeRecipientForDedup(message.recipient);
        const alreadySent = await this.messageRepository.hasSentRecipient(
          campaignId,
          normalizedRecipient
        );
        if (alreadySent) {
          await this.messageRepository.markFailed(
            message.id,
            "duplicate recipient already sent"
          );
          console.warn(
            `Skipping message ${message.id} because recipient ${message.recipient} was already sent`
          );
          continue;
        }
        const sent = await this.sendWithSender(sender.id, message);
        if (sent) {
          this.failureStreaks.set(sender.id, 0);
          this.sentRecipients.add(normalizedRecipient);
        } else {
          const streak = (this.failureStreaks.get(sender.id) ?? 0) + 1;
          this.failureStreaks.set(sender.id, streak);
          if (streak >= MAX_CONSECUTIVE_FAILURES) {
            console.warn(
              `Sender ${sender.id} entered COOLDOWN after ${streak} failures`
            );
            try {
              await this.senderRepository.updateStatus(
                sender.id,
                SenderAccountStatus.COOLDOWN
              );
            } catch (error) {
              console.error(
                `Failed to set COOLDOWN for sender ${sender.id}`,
                error
              );
            }
          }
        }
      }
      await this.completeCampaign(campaignId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Dispatch failed: ${message}`);
    }
  }

  private async sendWithSender(
    senderId: number,
    message: MessageRow
  ): Promise<boolean> {
    try {
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.SENDING
      );
      if (process.env.DRY_RUN === "1") {
        console.log(
          `DRY_RUN: skipping send for message ${message.id} to ${message.recipient} via sender ${senderId}`
        );
        await this.messageRepository.markSent(message.id);
        await this.senderRepository.updateStatus(
          senderId,
          SenderAccountStatus.CONNECTED
        );
        return true;
      }
      await this.provider.sendMessage(senderId, message.recipient, message.content);
      await this.messageRepository.markSent(message.id);
      console.log(`Message ${message.id} marked SENT`);
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.CONNECTED
      );
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.messageRepository.markFailed(message.id, errorMessage);
      console.error(`Message ${message.id} failed: ${errorMessage}`);
      if (!(error instanceof Error)) {
        console.error(`Message ${message.id} error value:`, error);
      } else if (error.stack) {
        console.error(error.stack);
      }
      await this.senderRepository.updateStatus(
        senderId,
        SenderAccountStatus.CONNECTED
      );
      return false;
    }
  }

  private async completeCampaign(campaignId: number): Promise<void> {
    const remaining = await this.messageRepository.countQueuedByCampaign(
      campaignId
    );
    if (remaining > 0) {
      console.log(
        `Campaign ${campaignId} still has ${remaining} queued messages`
      );
      return;
    }
    const failed = await this.messageRepository.countFailedByCampaign(campaignId);
    if (failed > 0) {
      await this.campaignRepository.markPaused(campaignId);
      console.log(
        `Campaign ${campaignId} marked PAUSED with ${failed} failed messages`
      );
    } else {
      await this.campaignRepository.markDone(campaignId);
      console.log(`Campaign ${campaignId} marked FINISHED`);
    }
    console.log(`Campaign ${campaignId} completed`);
  }
}

function pickSender(
  senders: { id: number }[],
  perSenderCount: Map<number, number>,
  maxPerSender: number,
  startIndex: number
): { id: number } | null {
  if (!senders.length) {
    return null;
  }
  for (let offset = 0; offset < senders.length; offset += 1) {
    const index = (startIndex + offset) % senders.length;
    const sender = senders[index];
    const current = perSenderCount.get(sender.id) ?? 0;
    if (current < maxPerSender) {
      perSenderCount.set(sender.id, current + 1);
      return sender;
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

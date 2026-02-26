import type { MessageProvider } from "../domain/message-provider.interface";
import { SenderAccountStatus } from "../domain/enums";
import type { SenderAccountRepository } from "../domain/sender-account.repository.interface";
import type { WorkerRepository } from "../domain/worker.repository.interface";
import { CampaignRepository } from "../infrastructure/repositories/campaign.repository";
import { MessageRepository, type MessageRow } from "../infrastructure/repositories/message.repository";

const MAX_MESSAGES_PER_TICK = 12;
const MAX_PER_SENDER_PER_TICK = 3;
const LOW_QUEUE_THRESHOLD = 50;
const FAST_DELAY_RANGE = { min: 150, max: 400 };
const SLOW_DELAY_RANGE = { min: 400, max: 900 };
const MAX_CONSECUTIVE_FAILURES = 3;

export class CampaignDispatchService {
  private provider: MessageProvider;
  private senderRepository: SenderAccountRepository;
  private workerRepository: WorkerRepository;
  private campaignRepository: CampaignRepository;
  private messageRepository: MessageRepository;
  private failureStreaks = new Map<number, number>();

  constructor(
    provider: MessageProvider,
    senderRepository: SenderAccountRepository,
    workerRepository: WorkerRepository,
    messageRepository: MessageRepository,
    campaignRepository: CampaignRepository
  ) {
    this.provider = provider;
    this.senderRepository = senderRepository;
    this.workerRepository = workerRepository;
    this.messageRepository = messageRepository;
    this.campaignRepository = campaignRepository;
  }

  async dispatchOnce(workerName: string): Promise<void> {
    try {
      const worker = await this.workerRepository.findByName(workerName);
      if (!worker?.currentCampaignId) {
        console.log(`Dispatch skip: worker ${workerName} has no campaign`);
        return;
      }

      const senders = await this.senderRepository.listByStatus(
        SenderAccountStatus.READY
      );
      if (!senders.length) {
        console.log(
          `Dispatch skip: no READY senders for campaign ${worker.currentCampaignId}`
        );
        return;
      }

      const messages = await this.messageRepository.listQueuedByCampaign(
        worker.currentCampaignId,
        MAX_MESSAGES_PER_TICK
      );
      if (!messages.length) {
        console.log(
          `Dispatch skip: no queued messages for campaign ${worker.currentCampaignId}`
        );
        await this.completeCampaign(worker.id, worker.currentCampaignId);
        return;
      }

      const senderLimit = Math.max(1, senders.length) * MAX_PER_SENDER_PER_TICK;
      const allowedCount = Math.min(messages.length, senderLimit);
      const batch = messages.slice(0, allowedCount);
      console.log(
        `Dispatching ${batch.length} messages for campaign ${worker.currentCampaignId}`
      );
      console.log(
        `Dispatch limits: max_per_tick=${MAX_MESSAGES_PER_TICK}, max_per_sender=${MAX_PER_SENDER_PER_TICK}, senders_ready=${senders.length}, queued=${messages.length}`
      );
      const delayRange =
        messages.length <= LOW_QUEUE_THRESHOLD
          ? FAST_DELAY_RANGE
          : SLOW_DELAY_RANGE;
      console.log(
        `Dispatch delay range: ${delayRange.min}-${delayRange.max}ms`
      );
      const perSenderCount = new Map<number, number>();
      for (const message of batch) {
        const sender = pickSender(senders, perSenderCount, MAX_PER_SENDER_PER_TICK);
        if (!sender) {
          console.warn("Dispatch stopped: no available senders for this tick");
          break;
        }
        await sleep(randomInt(delayRange.min, delayRange.max));
        console.log(
          `Sending message ${message.id} via sender ${sender.id} to ${message.recipient}`
        );
        const sent = await this.sendWithSender(sender.id, message);
        if (sent) {
          this.failureStreaks.set(sender.id, 0);
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
      await this.completeCampaign(worker.id, worker.currentCampaignId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Dispatch failed for worker ${workerName}: ${message}`);
    }
  }

  private async sendWithSender(
    senderId: number,
    message: MessageRow
  ): Promise<boolean> {
    try {
      await this.provider.sendMessage(senderId, message.recipient, message.payload);
      await this.messageRepository.markSent(message.id);
      console.log(`Message ${message.id} marked SENT`);
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
      return false;
    }
  }

  private async completeCampaign(workerId: number, campaignId: number): Promise<void> {
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
      await this.campaignRepository.markFailed(campaignId);
      console.log(
        `Campaign ${campaignId} marked FAILED with ${failed} failed messages`
      );
    } else {
      await this.campaignRepository.markDone(campaignId);
      console.log(`Campaign ${campaignId} marked DONE`);
    }
    await this.workerRepository.clearCampaign(workerId);
    console.log(`Worker ${workerId} cleared for campaign ${campaignId}`);
  }
}

function pickSender(
  senders: { id: number }[],
  perSenderCount: Map<number, number>,
  maxPerSender: number
): { id: number } | null {
  for (const sender of senders) {
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

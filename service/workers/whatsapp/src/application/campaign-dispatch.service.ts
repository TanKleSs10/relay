import type { MessageProvider } from "../domain/message-provider.interface";
import { SenderAccountStatus } from "../domain/enums";
import type { SenderAccountRepository } from "../domain/sender-account.repository.interface";
import type { WorkerRepository } from "../domain/worker.repository.interface";
import { CampaignRepository } from "../infrastructure/repositories/campaign.repository";
import { MessageRepository, type MessageRow } from "../infrastructure/repositories/message.repository";

const MAX_MESSAGES_PER_TICK = 6;

export class CampaignDispatchService {
  private provider: MessageProvider;
  private senderRepository: SenderAccountRepository;
  private workerRepository: WorkerRepository;
  private campaignRepository: CampaignRepository;
  private messageRepository: MessageRepository;

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

      console.log(
        `Dispatching ${messages.length} messages for campaign ${worker.currentCampaignId}`
      );
      await Promise.all(
        messages.map(async (message, index) => {
          const sender = senders[index % senders.length];
          console.log(
            `Sending message ${message.id} via sender ${sender.id} to ${message.recipient}`
          );
          await this.sendWithSender(sender.id, message);
        })
      );
      await this.completeCampaign(worker.id, worker.currentCampaignId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error(`Dispatch failed for worker ${workerName}: ${message}`);
    }
  }

  private async sendWithSender(senderId: number, message: MessageRow): Promise<void> {
    try {
      await this.provider.sendMessage(senderId, message.recipient, message.payload);
      await this.messageRepository.markSent(message.id);
      console.log(`Message ${message.id} marked SENT`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.messageRepository.markFailed(message.id, errorMessage);
      console.error(`Message ${message.id} failed: ${errorMessage}`);
      if (!(error instanceof Error)) {
        console.error(`Message ${message.id} error value:`, error);
      } else if (error.stack) {
        console.error(error.stack);
      }
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
    await this.campaignRepository.markDone(campaignId);
    await this.workerRepository.clearCampaign(workerId);
    console.log(`Campaign ${campaignId} marked DONE and worker cleared`);
  }
}

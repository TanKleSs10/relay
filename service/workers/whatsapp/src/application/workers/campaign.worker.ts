import { delay } from "../../utils/delay";
import type { Logger } from "../../utils/logger";
import type { CampaignManager } from "../managers/campaign.manager";

export class CampaignWorker {
  constructor(
    private manager: CampaignManager,
    private intervalMs: number,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    this.logger.info("worker started");
    while (true) {
      try {
        await this.manager.dispatchOnce();
      } catch (error) {
        this.logger.error("tick failed", error);
        await this.manager.finishActiveCampaign();
      }
      await delay(this.intervalMs);
    }
  }
}

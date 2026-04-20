import { delay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";
import type { QrManager } from "../managers/qr.manager.js";

export class QrWorker {
  constructor(
    private manager: QrManager,
    private intervalMs: number,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    this.logger.info("worker started");
    while (true) {
      try {
        await this.manager.tick();
      } catch (error) {
        this.logger.error("tick failed", error);
      }
      await delay(this.intervalMs);
    }
  }
}

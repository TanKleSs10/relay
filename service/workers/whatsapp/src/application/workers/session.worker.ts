import { delay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";
import type { SessionManager } from "../managers/session.manager.js";

export class SessionWorker {
  constructor(
    private manager: SessionManager,
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

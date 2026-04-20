import { delay } from "../../utils/delay.js";
import type { Logger } from "../../utils/logger.js";
import type { WorkerManager } from "../managers/worker.manager.js";

export class WorkerHeartbeatWorker {
  constructor(
    private manager: WorkerManager,
    private workerId: string,
    private intervalMs: number,
    private logger: Logger
  ) {}

  async start(): Promise<void> {
    this.logger.info("worker started");
    while (true) {
      try {
        await this.manager.heartbeat(this.workerId);
      } catch (error) {
        this.logger.error("tick failed", error);
      }
      await delay(this.intervalMs);
    }
  }
}

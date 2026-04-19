import { delay } from "../../utils/delay";
import type { Logger } from "../../utils/logger";
import type { WorkerManager } from "../managers/worker.manager";

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

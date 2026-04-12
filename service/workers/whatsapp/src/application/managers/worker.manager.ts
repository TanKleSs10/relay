import type { WorkerEntity } from "../../domain/entities/worker.entity";
import type { WorkerRepository } from "../../domain/interfaces/worker.repository.interface";
import { WorkerStatus } from "../../domain/enums";
import type { Logger } from "../../utils/logger";

export class WorkerManager {
  constructor(
    private repository: WorkerRepository,
    private logger: Logger
  ) {}

  async ensureWorker(workerName: string): Promise<WorkerEntity> {
    this.logger.info("worker init");
    const workerExist = await this.repository.findByName(workerName);
    if (workerExist) {
      this.logger.info(`worker ${workerName} ONLINE`);
      await this.repository.updateStatus(workerExist.id, WorkerStatus.ONLINE);
      return workerExist;
    }

    const created = await this.repository.createWorker(workerName, WorkerStatus.ONLINE);
    this.logger.info(`worker ${workerName} created`);
    return created;
  }

  async heartbeat(workerId: string): Promise<void> {
    try {
      await this.repository.updateStatus(workerId, WorkerStatus.ONLINE);
    } catch (error) {
      this.logger.error(`heartbeat failed for worker ${workerId}`, error);
    }
  }
}

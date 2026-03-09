import type { WorkerEntity } from "../entities/worker.entity";
import type { WorkerStatus } from "../enums";

export interface WorkerRepository {
  findByName(workerName: string): Promise<WorkerEntity | null>;
  createWorker(
    workerName: string,
    status: WorkerStatus
  ): Promise<WorkerEntity>;
  updateStatus(workerId: number, status: WorkerStatus): Promise<WorkerEntity>;
}

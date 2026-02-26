import type { WorkerEntity } from "./worker.entity";
import type { WorkerStatus } from "./enums";

export interface WorkerRepository {
  findByName(workerName: string): Promise<WorkerEntity | null>;
  createWorker(
    workerName: string,
    status: WorkerStatus,
    currentCampaignId?: number | null
  ): Promise<WorkerEntity>;
  updateStatus(workerId: number, status: WorkerStatus): Promise<WorkerEntity>;
  clearCampaign(workerId: number): Promise<WorkerEntity>;
}

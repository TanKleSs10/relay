import type { Pool } from "pg";

import { WorkerEntity } from "../../domain/worker.entity";
import type { WorkerStatus } from "../../domain/enums";
import type { WorkerRepository as WorkerRepositoryPort } from "../../domain/worker.repository.interface";

export class WorkerRepository implements WorkerRepositoryPort {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findByName(workerName: string): Promise<WorkerEntity | null> {
    const result = await this.pool.query(
      "SELECT id, worker_name, status, current_campaign_id, last_heartbeat, updated_at FROM worker_states WHERE worker_name = $1 LIMIT 1",
      [workerName]
    );
    const row = result.rows[0];
    return row ? WorkerEntity.fromRow(row) : null;
  }

  async createWorker(
    workerName: string,
    status: WorkerStatus,
    currentCampaignId: number | null = null
  ): Promise<WorkerEntity> {
    const result = await this.pool.query(
      "INSERT INTO worker_states (worker_name, status, current_campaign_id, last_heartbeat, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, worker_name, status, current_campaign_id, last_heartbeat, updated_at",
      [workerName, status, currentCampaignId]
    );
    return WorkerEntity.fromRow(result.rows[0]);
  }

  async updateStatus(workerId: number, status: WorkerStatus): Promise<WorkerEntity> {
    const result = await this.pool.query(
      "UPDATE worker_states SET status = $2, updated_at = NOW() WHERE id = $1 RETURNING id, worker_name, status, current_campaign_id, last_heartbeat, updated_at",
      [workerId, status]
    );
    return WorkerEntity.fromRow(result.rows[0]);
  }

  async clearCampaign(workerId: number): Promise<WorkerEntity> {
    const result = await this.pool.query(
      "UPDATE worker_states SET status = $2, current_campaign_id = NULL, updated_at = NOW() WHERE id = $1 RETURNING id, worker_name, status, current_campaign_id, last_heartbeat, updated_at",
      [workerId, "IDLE"]
    );
    return WorkerEntity.fromRow(result.rows[0]);
  }
}

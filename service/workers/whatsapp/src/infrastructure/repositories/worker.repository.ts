import type { Pool } from "pg";

import { WorkerEntity } from "../../domain/entities/worker.entity.js";
import { WorkerType } from "../../domain/enums/index.js";
import type { WorkerStatus } from "../../domain/enums/index.js";
import type { WorkerRepository as WorkerRepositoryPort } from "../../domain/interfaces/worker.repository.interface.js";

export class WorkerRepository implements WorkerRepositoryPort {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findByName(workerName: string): Promise<WorkerEntity | null> {
    const result = await this.pool.query(
      "SELECT id, worker_name, worker_type, status, last_seen, started_at FROM workers WHERE worker_name = $1 LIMIT 1",
      [workerName]
    );
    const row = result.rows[0];
    return row ? WorkerEntity.fromRow(row) : null;
  }

  async createWorker(
    workerName: string,
    status: WorkerStatus
  ): Promise<WorkerEntity> {
    const result = await this.pool.query(
      "INSERT INTO workers (worker_name, worker_type, status, last_seen, started_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, worker_name, worker_type, status, last_seen, started_at",
      [workerName, WorkerType.SESSION, status]
    );
    return WorkerEntity.fromRow(result.rows[0]);
  }

  async updateStatus(workerId: string, status: WorkerStatus): Promise<WorkerEntity> {
    const result = await this.pool.query(
      "UPDATE workers SET status = $2, last_seen = NOW() WHERE id = $1 RETURNING id, worker_name, worker_type, status, last_seen, started_at",
      [workerId, status]
    );
    return WorkerEntity.fromRow(result.rows[0]);
  }
}

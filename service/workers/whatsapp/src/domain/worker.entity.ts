import type { WorkerStatus, WorkerType } from "./enums";

export class WorkerEntity {
  id: number;
  workerName: string;
  workerType: WorkerType;
  status: WorkerStatus;
  lastSeen: Date | null;
  startedAt: Date | null;

  constructor(params: {
    id: number;
    workerName: string;
    workerType: WorkerType;
    status: WorkerStatus;
    lastSeen: Date | null;
    startedAt: Date | null;
  }) {
    this.id = params.id;
    this.workerName = params.workerName;
    this.workerType = params.workerType;
    this.status = params.status;
    this.lastSeen = params.lastSeen;
    this.startedAt = params.startedAt;
  }

  static fromRow(row: {
    id: number;
    worker_name: string;
    worker_type: string;
    status: string;
    last_seen: Date | null;
    started_at: Date | null;
  }): WorkerEntity {
    return new WorkerEntity({
      id: row.id,
      workerName: row.worker_name,
      workerType: row.worker_type as WorkerType,
      status: row.status as WorkerStatus,
      lastSeen: row.last_seen,
      startedAt: row.started_at,
    });
  }
}

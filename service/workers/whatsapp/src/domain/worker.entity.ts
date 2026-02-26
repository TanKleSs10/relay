import type { WorkerStatus } from "./enums";

export class WorkerEntity {
  id: number;
  workerName: string;
  status: WorkerStatus;
  currentCampaignId: number | null;
  lastHeartbeat: Date | null;
  updatedAt: Date;

  constructor(params: {
    id: number;
    workerName: string;
    status: WorkerStatus;
    currentCampaignId: number | null;
    lastHeartbeat: Date | null;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.workerName = params.workerName;
    this.status = params.status;
    this.currentCampaignId = params.currentCampaignId;
    this.lastHeartbeat = params.lastHeartbeat;
    this.updatedAt = params.updatedAt;
  }

  static fromRow(row: {
    id: number;
    worker_name: string;
    status: string;
    current_campaign_id: number | null;
    last_heartbeat: Date | null;
    updated_at: Date;
  }): WorkerEntity {
    return new WorkerEntity({
      id: row.id,
      workerName: row.worker_name,
      status: row.status,
      currentCampaignId: row.current_campaign_id,
      lastHeartbeat: row.last_heartbeat,
      updatedAt: row.updated_at,
    });
  }
}

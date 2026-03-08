import { request } from "../../../api";
import type { WorkerCount } from "../worker.types";

export function getAvailableWorkersCount() {
  return request<WorkerCount>("/workers/available-count");
}

export function getActiveWorkersCount() {
  return request<WorkerCount>("/workers/active-count");
}

export function resetWorker(workerId: number) {
  return request(`/workers/${workerId}/reset`, { method: "POST" });
}

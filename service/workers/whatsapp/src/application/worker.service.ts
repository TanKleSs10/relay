import type { WorkerRepository } from "../domain/worker.repository.interface";
import { WorkerStatus } from "../domain/enums";

export async function initWorker(
  repository: WorkerRepository,
  workerName: string
): Promise<void> {
  console.log("Worker initialized");
  const workerExist = await repository.findByName(workerName);
  if (workerExist) {
    console.log(`Worker with name ${workerName} already exists. Updating status to 'active'.`);
    await repository.updateStatus(workerExist.id, WorkerStatus.IDLE);
    return;
  }

  await repository.createWorker(workerName, WorkerStatus.IDLE);
  console.log(`Worker with name ${workerName} created and set to 'active'.`);
  return;
}

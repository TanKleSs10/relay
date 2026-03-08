import type { WorkerRepository } from "../domain/worker.repository.interface";
import { WorkerStatus } from "../domain/enums";

export async function initWorker(
  repository: WorkerRepository,
  workerName: string
): Promise<void> {
  console.log("Worker initialized");
  const workerExist = await repository.findByName(workerName);
  if (workerExist) {
    console.log(
      `Worker with name ${workerName} already exists. Updating status to 'ONLINE'.`
    );
    await repository.updateStatus(workerExist.id, WorkerStatus.ONLINE);
    return;
  }

  await repository.createWorker(workerName, WorkerStatus.ONLINE);
  console.log(`Worker with name ${workerName} created and set to 'ONLINE'.`);
  return;
}

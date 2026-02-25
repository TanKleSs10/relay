import { initWorker } from "./application/worker.service";
import { connectDB } from "./infrastructure/db/connection";
import { WorkerRepository } from "./infrastructure/repositories/worker.repository";
import { startLoop } from "./scheduler/loop";

const WORKER_NAME = "worker_whatsapp_1";

async function boostrap() {
  console.log("Starting WhatsApp Worker...");
  // Initialize database connection
  const pool = await connectDB();
  const workerRepository = new WorkerRepository(pool);
  await initWorker(workerRepository, WORKER_NAME);
  startLoop(pool);
}

boostrap();

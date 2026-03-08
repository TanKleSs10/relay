import { initWorker } from "./application/worker.service";
import { connectDB } from "./infrastructure/db/connection";
import { WorkerRepository } from "./infrastructure/repositories/worker.repository";
import { initQrManager } from "./scheduler/qrManager";
import { initSessionManager } from "./scheduler/sessionManager";
import { delay } from "./utils/delay";

const WORKER_NAME = "worker_whatsapp_1";

async function boostrap() {
  console.log("Starting WhatsApp Worker...");
  // Initialize database connection
  const pool = await connectDB();
  const workerRepository = new WorkerRepository(pool);
  await initWorker(workerRepository, WORKER_NAME);
}

boostrap();

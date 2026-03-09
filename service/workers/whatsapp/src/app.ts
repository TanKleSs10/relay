import { CampaignWorker } from "./application/workers/campaign.worker";
import { QrWorker } from "./application/workers/qr.worker";
import { SessionWorker } from "./application/workers/session.worker";
import { RecoveryWorker } from "./application/workers/recovery.worker";
import { RecoveryManager } from "./application/managers/recovery.manager";
import { CampaignManager } from "./application/managers/campaign.manager";
import { QrManager } from "./application/managers/qr.manager";
import { SessionManager } from "./application/managers/session.manager";
import { WorkerManager } from "./application/managers/worker.manager";
import { connectDB } from "./infrastructure/db/connection";
import { createMessageProvider } from "./infrastructure/providers/provider.factory";
import { CampaignRepository } from "./infrastructure/repositories/campaign.repository";
import { MessageRepository } from "./infrastructure/repositories/message.repository";
import { SenderRepository } from "./infrastructure/repositories/sender.repository";
import { SendLogRepository } from "./infrastructure/repositories/send-log.repository";
import { WorkerRepository } from "./infrastructure/repositories/worker.repository";
import { createLogger } from "./utils/logger";

const WORKER_NAME = "worker_whatsapp_1";
const QR_INTERVAL_MS = 2000;
const SESSION_INTERVAL_MS = 5000;
const CAMPAIGN_INTERVAL_MS = 2000;
const RECOVERY_INTERVAL_MS = 10000;

async function bootstrap() {
  const logger = createLogger("Bootstrap");
  logger.info("starting whatsapp worker");

  const pool = await connectDB();
  const provider = createMessageProvider();

  const workerRepository = new WorkerRepository(pool);
  const senderRepository = new SenderRepository(pool);
  const messageRepository = new MessageRepository(pool);
  const campaignRepository = new CampaignRepository(pool);
  const sendLogRepository = new SendLogRepository(pool);

  const workerManager = new WorkerManager(workerRepository, createLogger("WorkerManager"));
  const worker = await workerManager.ensureWorker(WORKER_NAME);

  const qrManager = new QrManager(provider, senderRepository, createLogger("QrManager"));
  const sessionManager = new SessionManager(
    provider,
    senderRepository,
    createLogger("SessionManager")
  );
  const campaignManager = new CampaignManager(
    provider,
    senderRepository,
    messageRepository,
    campaignRepository,
    createLogger("CampaignManager"),
    worker.id,
    sendLogRepository
  );
  const recoveryManager = new RecoveryManager(
    messageRepository,
    createLogger("RecoveryManager")
  );

  const qrWorker = new QrWorker(qrManager, QR_INTERVAL_MS, createLogger("QrWorker"));
  const sessionWorker = new SessionWorker(
    sessionManager,
    SESSION_INTERVAL_MS,
    createLogger("SessionWorker")
  );
  const campaignWorker = new CampaignWorker(
    campaignManager,
    CAMPAIGN_INTERVAL_MS,
    createLogger("CampaignWorker")
  );
  const recoveryWorker = new RecoveryWorker(
    recoveryManager,
    RECOVERY_INTERVAL_MS,
    createLogger("RecoveryWorker")
  );

  void qrWorker.start();
  void sessionWorker.start();
  void campaignWorker.start();
  void recoveryWorker.start();
}

bootstrap().catch((error) => {
  const logger = createLogger("Bootstrap");
  logger.error("fatal error during bootstrap", error);
  process.exitCode = 1;
});

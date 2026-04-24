import { CampaignWorker } from "./application/workers/campaign.worker.js";
import { QrWorker } from "./application/workers/qr.worker.js";
import { SessionWorker } from "./application/workers/session.worker.js";
import { RecoveryWorker } from "./application/workers/recovery.worker.js";
import { WorkerHeartbeatWorker } from "./application/workers/worker-heartbeat.worker.js";
import { RecoveryManager } from "./application/managers/recovery.manager.js";
import { CampaignManager } from "./application/managers/campaign.manager.js";
import { QrManager } from "./application/managers/qr.manager.js";
import { SessionManager } from "./application/managers/session.manager.js";
import { SenderLifecycleManager } from "./application/managers/sender-lifecycle.manager.js";
import { WorkerManager } from "./application/managers/worker.manager.js";
import { connectDB } from "./infrastructure/db/connection.js";
import { createMessageProvider } from "./infrastructure/providers/provider.factory.js";
import { CampaignRepository } from "./infrastructure/repositories/campaign.repository.js";
import { MessageRepository } from "./infrastructure/repositories/message.repository.js";
import { SenderRepository } from "./infrastructure/repositories/sender.repository.js";
import { SendLogRepository } from "./infrastructure/repositories/send-log.repository.js";
import { WorkerRepository } from "./infrastructure/repositories/worker.repository.js";
import { createLogger } from "./utils/logger.js";
import { SenderRetryController } from "./utils/sender-retry-controller.js";
import { attachWorkerEventLogger } from "./utils/worker-event-logger.js";
import { WorkerEventBus } from "./utils/worker-events.js";

const WORKER_NAME = "worker_whatsapp_1";
const QR_INTERVAL_MS = 2000;
const SESSION_INTERVAL_MS = 5000;
const CAMPAIGN_INTERVAL_MS = 2000;
const RECOVERY_INTERVAL_MS = 10000;
const WORKER_HEARTBEAT_MS = 5000;

async function bootstrap() {
  const logger = createLogger("Bootstrap");
  logger.info("starting whatsapp worker");

  const pool = await connectDB();
  const eventBus = new WorkerEventBus();
  const retryController = new SenderRetryController();
  attachWorkerEventLogger(eventBus, createLogger("WorkerEvents"));
  registerProcessGuards(eventBus);
  const provider = createMessageProvider(eventBus);

  const workerRepository = new WorkerRepository(pool);
  const senderRepository = new SenderRepository(pool);
  const messageRepository = new MessageRepository(pool);
  const campaignRepository = new CampaignRepository(pool);
  const sendLogRepository = new SendLogRepository(pool);

  const workerManager = new WorkerManager(workerRepository, createLogger("WorkerManager"));
  const worker = await workerManager.ensureWorker(WORKER_NAME);
  const senderLifecycleManager = new SenderLifecycleManager(
    provider,
    senderRepository,
    createLogger("SenderLifecycleManager"),
    retryController
  );

  const qrManager = new QrManager(
    provider,
    senderRepository,
    senderLifecycleManager,
    createLogger("QrManager"),
    retryController
  );
  const sessionManager = new SessionManager(
    provider,
    senderRepository,
    senderLifecycleManager,
    campaignRepository,
    createLogger("SessionManager"),
    retryController,
    eventBus
  );
  const campaignManager = new CampaignManager(
    provider,
    senderRepository,
    senderLifecycleManager,
    messageRepository,
    campaignRepository,
    createLogger("CampaignManager"),
    worker.id,
    sendLogRepository,
    retryController
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
  const heartbeatWorker = new WorkerHeartbeatWorker(
    workerManager,
    worker.id,
    WORKER_HEARTBEAT_MS,
    createLogger("WorkerHeartbeat")
  );

  void qrWorker.start();
  void sessionWorker.start();
  void campaignWorker.start();
  void recoveryWorker.start();
  void heartbeatWorker.start();
}

bootstrap().catch((error) => {
  const logger = createLogger("Bootstrap");
  logger.error("fatal error during bootstrap", error);
  process.exitCode = 1;
});

function registerProcessGuards(eventBus: WorkerEventBus): void {
  process.on("unhandledRejection", (error) => {
    eventBus.emit({
      type: "worker.unhandled_rejection",
      payload: { error },
    });
  });

  process.on("uncaughtException", (error) => {
    eventBus.emit({
      type: "worker.uncaught_exception",
      payload: { error },
    });
  });
}

import { EventEmitter } from "node:events";

export type WorkerEvent =
  | {
      type:
        | "worker.unhandled_rejection"
        | "worker.uncaught_exception";
      payload: {
        error: unknown;
      };
    }
  | {
      type:
        | "sender.init.started"
        | "sender.init.succeeded"
        | "sender.init.failed"
        | "sender.send.started"
        | "sender.send.succeeded"
        | "sender.send.failed"
        | "sender.qr.generated"
        | "sender.authenticated"
        | "sender.ready"
        | "sender.disconnected"
        | "sender.auth_failure"
        | "sender.state.changed"
        | "sender.state.unknown"
        | "sender.state.degraded"
        | "sender.client.cleared";
      payload: {
        senderId: string;
        sessionKey?: string | undefined;
        recipient?: string | undefined;
        state?: string | undefined;
        reason?: string | undefined;
        error?: unknown;
        category?: string | undefined;
        attempts?: number | undefined;
        threshold?: number | undefined;
      };
    };

type WorkerEventListener = (event: WorkerEvent) => void;

export class WorkerEventBus {
  private emitter = new EventEmitter();

  emit(event: WorkerEvent): void {
    this.emitter.emit("worker-event", event);
  }

  onEvent(listener: WorkerEventListener): void {
    this.emitter.on("worker-event", listener);
  }
}

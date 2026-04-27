const BASE_BACKOFF_MS = 30_000;
const MAX_BACKOFF_MS = 5 * 60_000;

type RetryState = {
  failures: number;
  nextRetryAt: number;
  sessionKey: string;
};

export class SenderRetryController {
  private state = new Map<string, RetryState>();

  canAttempt(senderId: string, sessionKey: string, now = Date.now()): boolean {
    const retryState = this.state.get(senderId);
    if (!retryState) {
      return true;
    }
    if (retryState.sessionKey !== sessionKey) {
      this.state.delete(senderId);
      return true;
    }
    return retryState.nextRetryAt <= now;
  }

  getRemainingMs(senderId: string, sessionKey: string, now = Date.now()): number {
    const retryState = this.state.get(senderId);
    if (!retryState) {
      return 0;
    }
    if (retryState.sessionKey !== sessionKey) {
      this.state.delete(senderId);
      return 0;
    }
    return Math.max(0, retryState.nextRetryAt - now);
  }

  recordFailure(senderId: string, sessionKey: string, now = Date.now()): RetryState {
    const current = this.state.get(senderId);
    const failures =
      current?.sessionKey === sessionKey ? (current.failures ?? 0) + 1 : 1;
    const backoff = Math.min(
      BASE_BACKOFF_MS * 2 ** (failures - 1),
      MAX_BACKOFF_MS
    );
    const nextRetryAt = now + backoff;
    const retryState = { failures, nextRetryAt, sessionKey };
    this.state.set(senderId, retryState);
    return retryState;
  }

  recordFailureWithBackoff(
    senderId: string,
    sessionKey: string,
    backoffMs: number,
    now = Date.now()
  ): RetryState {
    const current = this.state.get(senderId);
    const failures =
      current?.sessionKey === sessionKey ? (current.failures ?? 0) + 1 : 1;
    const retryState = {
      failures,
      nextRetryAt: now + Math.max(0, backoffMs),
      sessionKey,
    };
    this.state.set(senderId, retryState);
    return retryState;
  }

  recordSuccess(senderId: string): void {
    this.state.delete(senderId);
  }
}

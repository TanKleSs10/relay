type RateLimiterOptions = {
  maxPerInterval: number;
  intervalMs: number;
};

export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly intervalMs: number;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxPerInterval;
    this.tokens = options.maxPerInterval;
    this.intervalMs = options.intervalMs;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    while (this.tokens <= 0) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      this.refill();
    }
    this.tokens -= 1;
  }

  private refill(): void {
    const now = Date.now();
    if (now - this.lastRefill >= this.intervalMs) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }
  }
}

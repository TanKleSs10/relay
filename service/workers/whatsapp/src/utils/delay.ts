export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const min = Math.max(0, minMs);
  const max = Math.max(min, maxMs);
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  await delay(value);
}

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve): NodeJS.Timeout => setTimeout(resolve, ms));

export const jitter = (baseMs: number, maxJitterMs = 1000): number =>
  baseMs + Math.random() * maxJitterMs;

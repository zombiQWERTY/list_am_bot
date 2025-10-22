import { ConcurrencyLimits, SessionType } from './proxy.types';

/**
 * Proxy rotation configuration
 */
export const PROXY_CONFIG = {
  // Rotation intervals (in minutes)
  rotation: {
    baseMinutes: 15,
    maxMinutes: 30,
    jitterFraction: 0.2, // ±20%
  },

  // Retry policy
  retry: {
    maxAttempts: 3,
    baseDelayMs: 500,
    maxDelayMs: 2000,
    jitterMs: 250,
  },

  // Concurrency limits per proxy/session
  concurrency: {
    [SessionType.READ_ONLY]: 3,
    [SessionType.LOGIN]: 1,
    [SessionType.CHECKOUT]: 1,
  } as ConcurrencyLimits,

  // Health check
  healthCheck: {
    timeoutMs: 10000,
    maxFailures: 3,
    recoveryDelayMs: 60000, // Wait 1min before retrying unhealthy proxy
  },

  // IP verification
  ipCheck: {
    services: [
      'https://api.ipify.org?format=json',
      'https://ipinfo.io/json',
      'https://ifconfig.me/all.json',
    ],
    timeoutMs: 5000,
  },

  // Grace period for sticky session rotation
  gracefulHandoff: {
    waitForActiveTasksMs: 30000, // 30 seconds max
    checkIntervalMs: 1000,
  },
} as const;

/**
 * Calculate next rotation delay with jitter
 */
export function calculateNextRotationDelay(): number {
  const { baseMinutes, maxMinutes, jitterFraction } = PROXY_CONFIG.rotation;

  // Random multiplier: [-jitterFraction, +jitterFraction]
  const randomFactor = (Math.random() * 2 - 1) * jitterFraction;

  // Calculate next minutes with jitter
  const nextMinutes = Math.max(
    0.5, // Minimum 30 seconds
    Math.min(maxMinutes, baseMinutes * (1 + randomFactor)),
  );

  return nextMinutes * 60 * 1000; // Convert to milliseconds
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(attempt: number): number {
  const { baseDelayMs, maxDelayMs, jitterMs } = PROXY_CONFIG.retry;

  const exponentialDelay = Math.min(
    maxDelayMs,
    baseDelayMs * Math.pow(2, attempt),
  );

  const jitter = Math.random() * jitterMs;

  return exponentialDelay + jitter;
}

/**
 * Parse proxy string from servers.json format
 * Format: "username__cr.country1,country2:password@host:port"
 */
export function parseProxyString(proxyString: string): {
  username: string;
  password: string;
  host: string;
  port: number;
} {
  // Format: "username__cr.country1,country2:password@host:port"
  const regex = /^(.+):(.+)@(.+):(\d+)$/;
  const match = proxyString.match(regex);

  if (!match) {
    throw new Error(`Invalid proxy string format: ${proxyString}`);
  }

  const [, username, password, host, portStr] = match;

  return {
    username,
    password,
    host,
    port: parseInt(portStr, 10),
  };
}

/**
 * Proxy descriptor with all necessary information
 */
export interface ProxyDescriptor {
  id: string;
  proxyUrl: string;
  username: string;
  password: string;
  host: string;
  port: number;
  isHealthy: boolean;
  lastUsed: Date | null;
  activeConnections: number;
  failureCount: number;
}

/**
 * Sticky session binding
 */
export interface StickySession {
  sessionId: string;
  proxyId: string;
  assignedAt: Date;
  currentIp: string | null;
  shouldRotate: boolean;
  rotationTimer: NodeJS.Timeout | null;
}

/**
 * Proxy health status
 */
export interface ProxyHealthStatus {
  proxyId: string;
  isHealthy: boolean;
  reason?: string;
  checkedAt: Date;
}

/**
 * Error classification for retry logic
 */
export enum ErrorType {
  TRANSIENT = 'transient', // Retry with backoff
  FATAL = 'fatal', // Don't retry
  PROXY_RELATED = 'proxy_related', // Rotate proxy
}

/**
 * Error info with classification
 */
export interface ErrorInfo {
  type: ErrorType;
  originalError: Error;
  statusCode?: number;
  canRetry: boolean;
}

/**
 * Session type (read-only vs login/checkout)
 */
export enum SessionType {
  READ_ONLY = 'read_only',
  LOGIN = 'login',
  CHECKOUT = 'checkout',
}

/**
 * Concurrency limits per session type
 */
export interface ConcurrencyLimits {
  [SessionType.READ_ONLY]: number;
  [SessionType.LOGIN]: number;
  [SessionType.CHECKOUT]: number;
}

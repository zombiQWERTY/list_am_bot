import { readFileSync } from 'fs';
import { join } from 'path';

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { delay } from '@list-am-bot/common/utils/delay.util';
import {
  calculateNextRotationDelay,
  parseProxyString,
  PROXY_CONFIG,
} from '@list-am-bot/infrastructure/scraper/proxy/proxy.config';
import type {
  ProxyDescriptor,
  SessionType,
  StickySession,
} from '@list-am-bot/infrastructure/scraper/proxy/proxy.types';

/**
 * Proxy Manager Service
 * Manages proxy pool, rotation, sticky sessions, and health checks
 */
@Injectable()
export class ProxyManagerService implements OnModuleInit {
  private readonly logger = new Logger(ProxyManagerService.name);

  // Proxy pool
  private proxyPool: Map<string, ProxyDescriptor> = new Map();
  private healthyProxyIds: string[] = [];

  // Sticky sessions
  private stickySessions: Map<string, StickySession> = new Map();

  // Rotating proxy index
  private rotatingIndex = 0;

  // Task queue per proxy
  private proxyQueues: Map<string, number> = new Map();

  onModuleInit(): void {
    this.loadProxiesFromFile();
    this.logger.log(
      `✅ Proxy Manager initialized with ${this.proxyPool.size} proxies`,
    );
  }

  /**
   * Load proxies from servers.json
   */
  private loadProxiesFromFile(): void {
    try {
      const serversPath = join(process.cwd(), 'servers.json');
      this.logger.log(`Loading proxies from: ${serversPath}`);

      const content = readFileSync(serversPath, 'utf-8');
      const proxyStrings = JSON.parse(content) as string[];

      for (let i = 0; i < proxyStrings.length; i++) {
        const proxyString = proxyStrings[i];
        try {
          const parsed = parseProxyString(proxyString);
          const id = `proxy-${i}`;

          const descriptor: ProxyDescriptor = {
            id,
            proxyUrl: `http://${parsed.host}:${parsed.port}`,
            username: parsed.username,
            password: parsed.password,
            host: parsed.host,
            port: parsed.port,
            isHealthy: true,
            lastUsed: null,
            activeConnections: 0,
            failureCount: 0,
          };

          this.proxyPool.set(id, descriptor);
          this.healthyProxyIds.push(id);
          this.proxyQueues.set(id, 0);
        } catch (error) {
          this.logger.warn(
            `Failed to parse proxy string: ${proxyString}`,
            error,
          );
        }
      }

      this.logger.log(
        `Loaded ${this.proxyPool.size} proxies (${this.healthyProxyIds.length} healthy)`,
      );
    } catch (error) {
      this.logger.error('Failed to load proxies from file:', error);
      throw error;
    }
  }

  /**
   * Get rotating proxy (new proxy for each request)
   */
  getRotatingProxy(): ProxyDescriptor {
    if (this.healthyProxyIds.length === 0) {
      throw new Error('No healthy proxies available');
    }

    // Round-robin selection
    const proxyId =
      this.healthyProxyIds[this.rotatingIndex % this.healthyProxyIds.length];
    this.rotatingIndex++;

    const proxy = this.proxyPool.get(proxyId);
    if (!proxy) {
      throw new Error(`Proxy ${proxyId} not found in pool`);
    }

    proxy.lastUsed = new Date();
    proxy.activeConnections++;

    this.logger.debug(
      `🔄 Rotating proxy assigned: ${proxyId} (${proxy.activeConnections} active)`,
    );

    return proxy;
  }

  /**
   * Get sticky proxy for a session (same proxy until rotation)
   */
  async getStickyProxy(
    sessionId: string,
    sessionType: SessionType,
  ): Promise<ProxyDescriptor> {
    // Check if session already has a proxy
    const existingSession = this.stickySessions.get(sessionId);

    if (existingSession && !existingSession.shouldRotate) {
      const proxy = this.proxyPool.get(existingSession.proxyId);
      if (proxy && proxy.isHealthy) {
        this.logger.debug(
          `📌 Reusing sticky proxy for session ${sessionId}: ${proxy.id}`,
        );
        return proxy;
      }
    }

    // Find proxy with available capacity
    const proxy = await this.findAvailableProxy(sessionType);

    // Create new sticky session
    const rotationDelay = calculateNextRotationDelay();
    const rotationTimer = setTimeout((): void => {
      this.scheduleRotation(sessionId);
    }, rotationDelay);

    const session: StickySession = {
      sessionId,
      proxyId: proxy.id,
      assignedAt: new Date(),
      currentIp: null,
      shouldRotate: false,
      rotationTimer,
    };

    this.stickySessions.set(sessionId, session);

    proxy.activeConnections++;

    this.logger.log(
      `📌 Sticky proxy assigned: ${proxy.id} → session ${sessionId} (rotate in ${Math.round(rotationDelay / 60000)}min)`,
    );

    return proxy;
  }

  /**
   * Find proxy with available capacity
   */
  private async findAvailableProxy(
    sessionType: SessionType,
  ): Promise<ProxyDescriptor> {
    const maxConnections = PROXY_CONFIG.concurrency[sessionType];

    for (const proxyId of this.healthyProxyIds) {
      const proxy = this.proxyPool.get(proxyId);
      if (!proxy) continue;

      const currentQueue = this.proxyQueues.get(proxyId) || 0;

      if (currentQueue < maxConnections) {
        return proxy;
      }
    }

    // If no proxy available, wait and retry
    this.logger.warn('No proxy with available capacity, waiting 5s...');
    await delay(5000);
    return this.findAvailableProxy(sessionType);
  }

  /**
   * Release sticky proxy session
   */
  releaseStickyProxy(sessionId: string): void {
    const session = this.stickySessions.get(sessionId);
    if (!session) {
      return;
    }

    // Clear rotation timer
    if (session.rotationTimer) {
      clearTimeout(session.rotationTimer);
    }

    // Decrement active connections
    const proxy = this.proxyPool.get(session.proxyId);
    if (proxy && proxy.activeConnections > 0) {
      proxy.activeConnections--;
    }

    this.stickySessions.delete(sessionId);

    this.logger.debug(`🔓 Released sticky session: ${sessionId}`);
  }

  /**
   * Schedule proxy rotation for a session
   */
  private scheduleRotation(sessionId: string): void {
    const session = this.stickySessions.get(sessionId);
    if (!session) {
      return;
    }

    this.logger.log(
      `⏰ Rotation scheduled for session ${sessionId} (proxy: ${session.proxyId})`,
    );

    session.shouldRotate = true;
  }

  /**
   * Perform graceful handoff to new proxy
   */
  async performGracefulHandoff(
    sessionId: string,
    sessionType: SessionType,
  ): Promise<ProxyDescriptor> {
    const session = this.stickySessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const oldProxyId = session.proxyId;

    // Wait for active tasks to complete
    await this.waitForActiveTasks(oldProxyId);

    // Release old session
    this.releaseStickyProxy(sessionId);

    // Get new proxy
    const newProxy = await this.getStickyProxy(sessionId, sessionType);

    this.logger.log(
      `🔄 Graceful handoff: ${oldProxyId} → ${newProxy.id} for session ${sessionId}`,
    );

    return newProxy;
  }

  /**
   * Wait for active tasks to complete
   */
  private async waitForActiveTasks(proxyId: string): Promise<void> {
    const maxWait = PROXY_CONFIG.gracefulHandoff.waitForActiveTasksMs;
    const checkInterval = PROXY_CONFIG.gracefulHandoff.checkIntervalMs;
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const queueSize = this.proxyQueues.get(proxyId) || 0;

      if (queueSize === 0) {
        this.logger.debug(`All tasks completed for proxy ${proxyId}`);
        return;
      }

      this.logger.debug(
        `Waiting for ${queueSize} active tasks on proxy ${proxyId}...`,
      );
      await delay(checkInterval);
    }

    this.logger.warn(
      `Timeout waiting for active tasks on proxy ${proxyId}, proceeding anyway`,
    );
  }

  /**
   * Mark proxy as unhealthy
   */
  markUnhealthy(proxyId: string, reason?: string): void {
    const proxy = this.proxyPool.get(proxyId);
    if (!proxy) {
      return;
    }

    proxy.isHealthy = false;
    proxy.failureCount++;

    this.healthyProxyIds = this.healthyProxyIds.filter(
      (id): boolean => id !== proxyId,
    );

    this.logger.warn(
      `❌ Proxy ${proxyId} marked as unhealthy (failures: ${proxy.failureCount})${reason ? `: ${reason}` : ''}`,
    );

    // Schedule recovery check
    setTimeout((): void => {
      this.attemptProxyRecovery(proxyId);
    }, PROXY_CONFIG.healthCheck.recoveryDelayMs);
  }

  /**
   * Attempt to recover unhealthy proxy
   */
  private attemptProxyRecovery(proxyId: string): void {
    const proxy = this.proxyPool.get(proxyId);
    if (!proxy) {
      return;
    }

    // Reset health status if failure count is below max
    if (proxy.failureCount < PROXY_CONFIG.healthCheck.maxFailures) {
      proxy.isHealthy = true;
      proxy.failureCount = 0;
      this.healthyProxyIds.push(proxyId);

      this.logger.log(`✅ Proxy ${proxyId} recovered and marked as healthy`);
    } else {
      this.logger.error(
        `Proxy ${proxyId} exceeded max failures (${proxy.failureCount}), not recovering`,
      );
    }
  }

  /**
   * Update session IP
   */
  updateSessionIp(sessionId: string, ip: string): void {
    const session = this.stickySessions.get(sessionId);
    if (session) {
      session.currentIp = ip;
    }
  }

  /**
   * Check if session should rotate
   */
  shouldRotateSession(sessionId: string): boolean {
    const session = this.stickySessions.get(sessionId);
    return session ? session.shouldRotate : false;
  }

  /**
   * Increment proxy queue counter
   */
  incrementProxyQueue(proxyId: string): void {
    const current = this.proxyQueues.get(proxyId) || 0;
    this.proxyQueues.set(proxyId, current + 1);
  }

  /**
   * Decrement proxy queue counter
   */
  decrementProxyQueue(proxyId: string): void {
    const current = this.proxyQueues.get(proxyId) || 0;
    if (current > 0) {
      this.proxyQueues.set(proxyId, current - 1);
    }
  }

  /**
   * Get proxy statistics
   */
  getProxyStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    activeSessions: number;
  } {
    return {
      total: this.proxyPool.size,
      healthy: this.healthyProxyIds.length,
      unhealthy: this.proxyPool.size - this.healthyProxyIds.length,
      activeSessions: this.stickySessions.size,
    };
  }
}

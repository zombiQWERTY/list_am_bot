import { Injectable, Logger } from '@nestjs/common';

import {
  ErrorInfo,
  ErrorType,
} from '@list-am-bot/infrastructure/scraper/proxy/proxy.types';

/**
 * Service to classify errors and determine retry strategy
 */
@Injectable()
export class ErrorClassifierService {
  private readonly logger = new Logger(ErrorClassifierService.name);

  /**
   * Classify error and determine if it can be retried
   */
  classifyError(error: Error): ErrorInfo {
    const originalError =
      error instanceof Error ? error : new Error(String(error));
    const errorMessage = originalError.message.toLowerCase();

    // Extract status code if available
    const statusCode = this.extractStatusCode(originalError);

    // Fatal errors (don't retry)
    if (this.isFatalError(statusCode, errorMessage)) {
      return {
        type: ErrorType.FATAL,
        originalError,
        statusCode,
        canRetry: false,
      };
    }

    // Proxy-related errors (rotate proxy)
    if (this.isProxyRelatedError(statusCode, errorMessage)) {
      return {
        type: ErrorType.PROXY_RELATED,
        originalError,
        statusCode,
        canRetry: true,
      };
    }

    // Transient errors (retry with backoff)
    if (this.isTransientError(statusCode, errorMessage)) {
      return {
        type: ErrorType.TRANSIENT,
        originalError,
        statusCode,
        canRetry: true,
      };
    }

    // Default: treat as transient
    return {
      type: ErrorType.TRANSIENT,
      originalError,
      statusCode,
      canRetry: true,
    };
  }

  private extractStatusCode(error: Error): number | undefined {
    const errorAny = error as { statusCode?: number; status?: number };
    return errorAny.statusCode || errorAny.status;
  }

  private isFatalError(
    statusCode: number | undefined,
    message: string,
  ): boolean {
    // HTTP status codes that indicate fatal errors
    const fatalStatusCodes = [
      403, // Forbidden (definite block)
      451, // Unavailable for legal reasons
      410, // Gone
    ];

    if (statusCode && fatalStatusCodes.includes(statusCode)) {
      return true;
    }

    // Fatal error messages
    const fatalPatterns = [
      'captcha.*not.*resolved',
      'permanently.*blocked',
      'access.*denied',
      'ip.*banned',
    ];

    return fatalPatterns.some((pattern): boolean =>
      new RegExp(pattern).test(message),
    );
  }

  private isProxyRelatedError(
    statusCode: number | undefined,
    message: string,
  ): boolean {
    // HTTP status codes related to proxy issues
    const proxyStatusCodes = [
      407, // Proxy Authentication Required
      502, // Bad Gateway
      503, // Service Unavailable (often proxy)
    ];

    if (statusCode && proxyStatusCodes.includes(statusCode)) {
      return true;
    }

    // Proxy-related error messages
    const proxyPatterns = [
      'proxy',
      'econnrefused',
      'econnreset',
      'etimedout',
      'timeout',
      'network',
      'dns',
    ];

    return proxyPatterns.some((pattern): boolean => message.includes(pattern));
  }

  private isTransientError(
    statusCode: number | undefined,
    message: string,
  ): boolean {
    // HTTP status codes that are transient
    const transientStatusCodes = [
      408, // Request Timeout
      429, // Too Many Requests
      500, // Internal Server Error
      504, // Gateway Timeout
    ];

    if (statusCode && transientStatusCodes.includes(statusCode)) {
      return true;
    }

    // Transient error messages
    const transientPatterns = [
      'timeout',
      'temporary',
      'try.*again',
      'rate.*limit',
    ];

    return transientPatterns.some((pattern): boolean =>
      new RegExp(pattern).test(message),
    );
  }

  /**
   * Normalize error for logging
   */
  normalizeError(error: Error): string {
    const errorInfo = this.classifyError(error);
    const statusText = errorInfo.statusCode
      ? ` (HTTP ${errorInfo.statusCode})`
      : '';
    return `[${errorInfo.type.toUpperCase()}]${statusText} ${errorInfo.originalError.message}`;
  }
}

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorDetails {
  status: HttpStatus;
  message: string | object;
  errorCode: string;
  additionalDetails: Record<string, unknown>;
}

interface ErrorWithCode extends Error {
  code?: string;
}

interface ErrorWithCause extends Error {
  cause?: unknown;
}

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message, errorCode, additionalDetails } =
      this.getErrorDetails(exception);

    this.logError(
      exception,
      status,
      message,
      errorCode,
      request,
      additionalDetails,
    );

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      errorCode,
      additionalDetails,
    });
  }

  private getErrorDetails(exception: unknown): ErrorDetails {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      const message =
        typeof response === 'string'
          ? response
          : (response as { message?: string }).message || 'HTTP Exception';

      return {
        status: exception.getStatus(),
        message,
        errorCode: 'HTTP_EXCEPTION',
        additionalDetails: { details: message },
      };
    }

    // TypeORM/Database errors
    if (
      exception &&
      typeof exception === 'object' &&
      'constructor' in exception &&
      exception.constructor.name === 'QueryFailedError'
    ) {
      const error = exception as Error;
      return {
        status: HttpStatus.BAD_REQUEST,
        message: `Database error: ${error.message.replace(/\n/g, '')}`,
        errorCode: 'DATABASE_ERROR',
        additionalDetails: {
          code: (exception as ErrorWithCode).code || 'UNKNOWN',
        },
      };
    }

    // Generic error
    if (exception instanceof Error) {
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: exception.message || 'Internal server error',
        errorCode: 'INTERNAL_SERVER_ERROR',
        additionalDetails: {
          name: exception.name,
          stack: exception.stack,
        },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Unexpected error',
      errorCode: 'INTERNAL_SERVER_ERROR',
      additionalDetails: {
        error: String(exception),
      },
    };
  }

  private logError(
    exception: unknown,
    status: HttpStatus,
    message: string | object,
    errorCode: string,
    request: Request,
    additionalDetails: Record<string, unknown>,
  ): void {
    const messageStr =
      typeof message === 'string' ? message : JSON.stringify(message);

    const logData: Record<string, unknown> = {
      message: `Exception thrown: ${messageStr}`,
      statusCode: status,
      errorCode,
      url: request.url,
      method: request.method,
      additionalDetails,
    };

    if (exception && typeof exception === 'object') {
      if ('constructor' in exception) {
        logData.exceptionType = (
          exception.constructor as { name: string }
        ).name;
      }

      if (exception instanceof Error) {
        logData.stack = exception.stack;
        logData.cause = (exception as ErrorWithCause).cause;
      }
    }

    this.logger.error(logData);
  }
}

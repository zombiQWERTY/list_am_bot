import { HttpException, HttpStatus } from '@nestjs/common';

export class EntityNotFoundException extends HttpException {
  constructor(entityName: string, id?: number | string) {
    const message = id
      ? `${entityName} with id ${id} not found`
      : `${entityName} not found`;
    super(message, HttpStatus.NOT_FOUND);
  }
}

export class DuplicateSubscriptionException extends HttpException {
  constructor(query: string) {
    super(
      `Subscription for query "${query}" already exists`,
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidQueryException extends HttpException {
  constructor(reason: string) {
    super(`Invalid query: ${reason}`, HttpStatus.BAD_REQUEST);
  }
}

export class ScraperException extends HttpException {
  constructor(message: string) {
    super(`Scraper error: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

export class MaxSubscriptionsReachedException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.FORBIDDEN);
  }
}

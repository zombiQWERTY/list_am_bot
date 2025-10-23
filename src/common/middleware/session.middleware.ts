import { Logger } from '@nestjs/common';
import { Postgres } from '@telegraf/session/pg';
import { Context, MiddlewareFn, session } from 'telegraf';

export interface SessionConfig {
  postgresUrl: string;
  tableName?: string;
}

export function createSessionMiddleware(
  config: SessionConfig,
): MiddlewareFn<Context> {
  const logger = new Logger('SessionMiddleware');

  if (!config.postgresUrl) {
    logger.warn('PostgreSQL URL not provided, using in-memory session storage');
    return session();
  }

  try {
    const url = new URL(config.postgresUrl);

    const store = Postgres<Record<string, unknown>>({
      host: url.hostname,
      port: url.port ? parseInt(url.port, 10) : 5432,
      database: url.pathname.slice(1),
      user: url.username,
      password: url.password,
      table: config.tableName || 'telegraf_sessions',
      onInitError: (error: unknown): void => {
        logger.error('PostgreSQL session storage init error', error);
      },
    });

    logger.log('PostgreSQL session storage initialized');

    return session({ store });
  } catch (error) {
    logger.error('Failed to initialize PostgreSQL session storage', error);
    logger.warn('Falling back to in-memory session storage');
    return session();
  }
}

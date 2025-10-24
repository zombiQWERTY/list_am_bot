import { Logger } from '@nestjs/common';
import { Postgres } from '@telegraf/session/pg';
import { Context, MiddlewareFn, session, SessionStore } from 'telegraf';

import { DatabaseSchemaType } from '@list-am-bot/common/config/database.config';

export const getSessionMiddleware = (
  dbConfig: DatabaseSchemaType,
): MiddlewareFn<Context> => {
  const logger = new Logger('SessionMiddleware');

  const store = Postgres({
    config: {
      connectionString: dbConfig.postgresBaseUrl,
      options: `-c search_path=${dbConfig.postgresTelegrafSchema}`,
    },
    onInitError: (e: unknown): void => {
      logger.error(e);
    },
  });

  return session({ store: store as SessionStore<Context> });
};

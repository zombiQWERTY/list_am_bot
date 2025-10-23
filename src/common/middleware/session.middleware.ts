import { Logger } from '@nestjs/common';
import { Postgres } from '@telegraf/session/pg';
import { Context, MiddlewareFn, session, SessionStore } from 'telegraf';

import { getDbConfig } from '@list-am-bot/common/config/database.config';

export const getSessionMiddleware = (): MiddlewareFn<Context> => {
  const dbConfig = getDbConfig();
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

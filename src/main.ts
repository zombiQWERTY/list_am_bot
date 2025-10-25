import 'reflect-metadata';
import * as process from 'process';

import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { config as dotEnvConfig } from 'dotenv';
import { expand as dotEnvExpand } from 'dotenv-expand';
import { getBotToken } from 'nestjs-telegraf';
import { install as sourceMapInstall } from 'source-map-support';
import { Telegraf } from 'telegraf';

import { AppModule } from '@list-am-bot/app.module';
import { GlobalExceptionsFilter } from '@list-am-bot/common/filters/globalExceptions.filter';
import { makeLogger } from '@list-am-bot/common/utils/winstonLogger';
import { LIST_AM_BOT } from '@list-am-bot/constants';
import { BotContext } from '@list-am-bot/context/context.interface';

sourceMapInstall();

async function bootstrap(): Promise<void> {
  dotEnvExpand(dotEnvConfig());

  const logger = makeLogger('ListAmBot');

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  if (process.env.NODE_ENV === 'production') {
    const bot = app.get<Telegraf<BotContext>>(getBotToken(LIST_AM_BOT));
    app.use(bot.webhookCallback(process.env.BOT_WEBHOOK_URL));
  }

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new GlobalExceptionsFilter(logger));

  const port = parseInt(process.env.SERVICE_REST_PORT || '0', 10);
  await app.listen(port);

  logger.log(`🚀 List.am Bot is running on port ${port}`, 'Bootstrap');
  logger.log(
    `🌍 Environment: ${process.env.NODE_ENV || 'development'}`,
    'Bootstrap',
  );

  const gracefulShutdown = async (signal: string): Promise<void> => {
    logger.log(
      `📥 Received ${signal} signal. Starting graceful shutdown...`,
      'Bootstrap',
    );

    try {
      await app.close();
      logger.log('✅ Application closed successfully', 'Bootstrap');
      process.exit(0);
    } catch (error) {
      logger.error(
        `❌ Error during shutdown: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'Bootstrap',
      );
      process.exit(1);
    }
  };

  process.on('SIGTERM', (): void => void gracefulShutdown('SIGTERM'));
  process.on('SIGINT', (): void => void gracefulShutdown('SIGINT'));
}

void bootstrap();

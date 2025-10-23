import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const botConfigSchema = z.object({
  token: z.string().min(1, 'BOT_TOKEN is required'),
  adminUserId: z.number().optional(),
});

export type BotConfigType = z.infer<typeof botConfigSchema>;

export const botConfig = registerAs('bot', (): BotConfigType => {
  const config = {
    token: process.env.BOT_TOKEN,
    adminUserId: process.env.BOT_INCIDENTS_USER_ID
      ? parseInt(process.env.BOT_INCIDENTS_USER_ID, 10)
      : undefined,
  };

  return botConfigSchema.parse(config);
});

export const BOT_CONFIG_KEY = 'bot';

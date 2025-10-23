import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const botConfigSchema = z.object({
  botToken: z.string().min(1, 'BOT_TOKEN is required'),
  botIncidentsUserId: z.number().optional(),
  botEnvironment: z.string().default('local'),
  botDomain: z.string().optional(),
  botWebhookUrl: z.string().optional(),
});

export type BotSchemaType = z.infer<typeof botConfigSchema>;

export const botConfig = registerAs('bot', (): BotSchemaType => {
  const config = {
    botToken: process.env.BOT_TOKEN,
    botIncidentsUserId: process.env.BOT_INCIDENTS_USER_ID
      ? parseInt(process.env.BOT_INCIDENTS_USER_ID, 10)
      : undefined,
    botEnvironment: process.env.BOT_ENVIRONMENT || 'local',
    botDomain: process.env.BOT_DOMAIN,
    botWebhookUrl: process.env.BOT_WEBHOOK_URL,
  };

  return botConfigSchema.parse(config);
});

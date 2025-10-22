import { z } from 'zod';

const configSchema = z.object({
  botToken: z.string().min(1),
  cronSchedule: z.string().default('0 * * * *'),
  fetchTimeoutMs: z.number().default(15000),
  requestDelayMs: z.number().default(2500),
  maxRetries: z.number().default(3),
  listAmBaseUrl: z.string().url().default('https://www.list.am'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
});

export type AppConfig = z.infer<typeof configSchema>;

export const validateAndLoadConfig = (): AppConfig => {
  const rawConfig = {
    botToken: process.env.BOT_TOKEN,
    cronSchedule: process.env.CRON_SCHEDULE,
    fetchTimeoutMs: process.env.FETCH_TIMEOUT_MS
      ? parseInt(process.env.FETCH_TIMEOUT_MS, 10)
      : undefined,
    requestDelayMs: process.env.REQUEST_DELAY_MS
      ? parseInt(process.env.REQUEST_DELAY_MS, 10)
      : undefined,
    maxRetries: process.env.MAX_RETRIES
      ? parseInt(process.env.MAX_RETRIES, 10)
      : undefined,
    listAmBaseUrl: process.env.LISTAM_BASE_URL,
    logLevel: process.env.LOG_LEVEL,
    nodeEnv: process.env.NODE_ENV,
  };

  return configSchema.parse(rawConfig);
};

export const appConfigFactory = (): AppConfig => validateAndLoadConfig();

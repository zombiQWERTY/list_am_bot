import { Logger } from '@nestjs/common';
import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const configSchema = z.object({
  botToken: z.string().min(1, 'BOT_TOKEN is required'),
  cronSchedule: z.string().default('0 * * * *'),
  requestDelayMs: z.number().positive().default(2500),
  listAmBaseUrl: z.string().url().default('https://www.list.am'),
  node_env: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export type AppSchemaType = z.infer<typeof configSchema>;

function formatValidationError(error: ZodError): string {
  const errors = error.errors.map((err): string => {
    const path = err.path.join('.');
    return `  - ${path}: ${err.message}`;
  });

  return `Configuration validation failed:\n${errors.join('\n')}\n\nPlease check your environment variables.`;
}

export const validateAndLoadConfig = (): AppSchemaType => {
  const rawConfig = {
    botToken: process.env.BOT_TOKEN,
    cronSchedule: process.env.CRON_SCHEDULE,
    requestDelayMs: process.env.REQUEST_DELAY_MS
      ? parseInt(process.env.REQUEST_DELAY_MS, 10)
      : undefined,
    listAmBaseUrl: process.env.LISTAM_BASE_URL,
    node_env: process.env.NODE_ENV,
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatValidationError(error);
      Logger.error(`\n❌ ${formattedError}\n`);
      process.exit(1);
    }
    throw error;
  }
};

export const appConfig = registerAs(
  'app',
  (): AppSchemaType => validateAndLoadConfig(),
);

export const appConfigFactory = (): AppSchemaType => validateAndLoadConfig();

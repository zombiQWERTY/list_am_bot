import { registerAs } from '@nestjs/config';
import { z, ZodError } from 'zod';

const configSchema = z.object({
  botToken: z.string().min(1, 'BOT_TOKEN is required'),
  cronSchedule: z.string().default('0 * * * *'),
  fetchTimeoutMs: z.number().positive().default(15000),
  requestDelayMs: z.number().positive().default(2500),
  maxRetries: z.number().positive().int().default(3),
  listAmBaseUrl: z.string().url().default('https://www.list.am'),
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  node_env: z.enum(['development', 'production', 'test']).default('development'),
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
    node_env: process.env.NODE_ENV,
  };

  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedError = formatValidationError(error);
      console.error(`\n❌ ${formattedError}\n`);
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

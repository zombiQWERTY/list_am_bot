import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const PostgresConfigSchema = z.object({
  postgresUrl: z.string(),
  postgresHost: z.string(),
  postgresPort: z.string(),
  postgresName: z.string(),
  postgresUser: z.string(),
  postgresPassword: z.string(),
  postgresBaseUrl: z.string(),
  postgresTelegrafSchema: z.string(),
});

export type DatabaseSchemaType = z.infer<typeof PostgresConfigSchema>;

export const getDbConfig = (): DatabaseSchemaType => ({
  postgresUrl: process.env.POSTGRES_BASE_URL || '',
  postgresHost: process.env.POSTGRES_HOST || '',
  postgresPort: process.env.POSTGRES_PORT || '',
  postgresName: process.env.POSTGRES_NAME || '',
  postgresUser: process.env.POSTGRES_USERNAME || '',
  postgresPassword: process.env.POSTGRES_PASSWORD || '',
  postgresBaseUrl: process.env.POSTGRES_BASE_URL || '',
  postgresTelegrafSchema: process.env.POSTGRES_TELEGRAF_SCHEMA || 'public',
});

export const postgresConfig = registerAs('database', (): DatabaseSchemaType => {
  return PostgresConfigSchema.parse(getDbConfig());
});

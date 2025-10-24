import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appConfigSchema = z.object({
  listAmBaseUrl: z.string().url().default('https://www.list.am'),
  node_env: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  port: z.number().default(3000),
});

export type AppSchemaType = z.infer<typeof appConfigSchema>;

export const appConfig = registerAs('app', (): AppSchemaType => {
  const config = {
    listAmBaseUrl: process.env.LISTAM_BASE_URL,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
  };

  return appConfigSchema.parse(config);
});

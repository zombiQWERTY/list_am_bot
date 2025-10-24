import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const appConfigSchema = z.object({
  node_env: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  port: z.number().default(3000),
});

export type AppSchemaType = z.infer<typeof appConfigSchema>;

export const appConfig = registerAs('app', (): AppSchemaType => {
  const config = {
    node_env: process.env.NODE_ENV,
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
  };

  return appConfigSchema.parse(config);
});

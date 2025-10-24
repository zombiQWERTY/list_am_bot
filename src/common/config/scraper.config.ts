import { registerAs } from '@nestjs/config';
import { z } from 'zod';

const scraperConfigSchema = z.object({
  flaresolverr: z.object({
    url: z.string().url().optional(),
    port: z.coerce.number().int().positive().default(8191),
    maxTimeout: z.coerce.number().int().positive().default(60000),
  }),
});

export type ScraperConfig = z.infer<typeof scraperConfigSchema>;

export default registerAs('scraper', (): ScraperConfig => {
  const config = {
    flaresolverr: {
      url: process.env.FLARESOLVERR_URL,
      port: process.env.FLARESOLVERR_PORT,
      maxTimeout: process.env.FLARESOLVERR_MAX_TIMEOUT,
    },
  };

  return scraperConfigSchema.parse(config);
});

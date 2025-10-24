import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { ScraperException } from '@list-am-bot/common/exceptions/bot.exceptions';
import { Listing, ScrapeResult } from '@list-am-bot/common/types/listing.types';
import {
  SeenListingRepositoryPort,
  ISeenListingRepository,
} from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { FlaresolvrrService } from '@list-am-bot/infrastructure/scraper/flaresolverr.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly flaresolvrrService: FlaresolvrrService,
    private readonly parser: ParserService,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService,
    @Inject(SeenListingRepositoryPort)
    private readonly seenListingRepository: ISeenListingRepository,
  ) {
    this.baseUrl = this.configService.get<string>('app.listAmBaseUrl');
  }

  async scrapeQuery(query: string, retryOnEmpty = true): Promise<ScrapeResult> {
    this.logger.debug(`Starting scrape for query: "${query}"`);
    const startTime = Date.now();

    try {
      const searchUrl = this.parser.buildSearchUrl(this.baseUrl, query);

      const html = await this.flaresolvrrService.fetchHtml(searchUrl);
      const listings = this.parser.extractListings(html, this.baseUrl);

      const duration = Date.now() - startTime;
      await this.metricsService.recordScrapeDuration(duration, query);

      this.logger.debug(
        `Scrape complete. Found ${listings.length} listings for "${query}" (${duration}ms)`,
      );

      // If we got 0 listings, it might be Cloudflare blocking
      // Retry once (FlareSolverr will handle it internally)
      if (listings.length === 0 && retryOnEmpty) {
        this.logger.debug(
          `⚠️  Got 0 listings (suspicious - likely Cloudflare). Retrying...`,
        );

        // Retry without retryOnEmpty to avoid infinite loop
        return this.scrapeQuery(query, false);
      }

      return {
        query,
        listings,
        fetchedAt: new Date(),
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      await this.metricsService.recordScrapeDuration(duration, query);

      this.logger.error(`Scrape failed for query "${query}":`, error);
      throw new ScraperException(
        `Failed to scrape query "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async filterNewListings(
    subscriptionId: number,
    listings: Listing[],
  ): Promise<Listing[]> {
    if (listings.length === 0) {
      return [];
    }

    const listingIds = listings.map((l): string => l.id);
    const newListingIds = await this.seenListingRepository.filterNewListings(
      subscriptionId,
      listingIds,
    );

    return listings.filter((l): boolean => newListingIds.includes(l.id));
  }

  async markListingsAsSeen(
    subscriptionId: number,
    listings: Listing[],
  ): Promise<void> {
    if (listings.length === 0) {
      return;
    }

    const listingIds = listings.map((l): string => l.id);
    await this.seenListingRepository.markAsSeen(subscriptionId, listingIds);
  }
}

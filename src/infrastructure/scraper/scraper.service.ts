import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ScraperException } from '@list-am-bot/common/exceptions/bot.exceptions';
import { Listing, ScrapeResult } from '@list-am-bot/common/types/listing.types';
import {
  SeenListingRepositoryPort,
  ISeenListingRepository,
} from '@list-am-bot/domain/seen-listing/ports/seen-listing.repository.port';
import { HttpClientService } from '@list-am-bot/infrastructure/scraper/http-client.service';
import { ParserService } from '@list-am-bot/infrastructure/scraper/parser.service';

@Injectable()
export class ScraperService {
  private readonly baseUrl: string;

  constructor(
    private readonly httpClient: HttpClientService,
    private readonly parser: ParserService,
    private readonly configService: ConfigService,
    @Inject(SeenListingRepositoryPort)
    private readonly seenListingRepository: ISeenListingRepository,
  ) {
    this.baseUrl = this.configService.get<string>(
      'listAmBaseUrl',
      'https://www.list.am',
    );
  }

  async scrapeQuery(query: string): Promise<ScrapeResult> {
    try {
      const searchUrl = this.parser.buildSearchUrl(this.baseUrl, query);
      const html = await this.httpClient.fetchHtml(searchUrl);
      const listings = this.parser.extractListings(html, this.baseUrl);

      return {
        query,
        listings,
        fetchedAt: new Date(),
      };
    } catch (error) {
      throw new ScraperException(
        `Failed to scrape query "${query}": ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async filterNewListings(
    subscriptionId: number,
    listings: Listing[],
  ): Promise<Listing[]> {
    if (listings.length === 0) return [];

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
    if (listings.length === 0) return;

    const listingIds = listings.map((l): string => l.id);
    await this.seenListingRepository.markAsSeen(subscriptionId, listingIds);
  }
}

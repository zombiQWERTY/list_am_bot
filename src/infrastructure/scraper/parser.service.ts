import { createHash } from 'crypto';

import { Injectable, Logger } from '@nestjs/common';
import { type Cheerio, load } from 'cheerio';

import { Listing } from '@list-am-bot/common/types/listing.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = Cheerio<any>;

@Injectable()
export class ParserService {
  private readonly logger = new Logger(ParserService.name);
  extractListings(html: string, baseUrl: string): Listing[] {
    this.logger.debug(`Starting HTML parsing, HTML size: ${html.length} bytes`);

    const $ = load(html);
    const listings: Listing[] = [];
    const seenIds = new Set<string>();

    const elements = $('a.fav-item-info-container[href*="/item/"]');
    this.logger.debug(`Found ${elements.length} listing elements`);

    elements.each((index, element): void => {
      try {
        const $el = $(element);
        const href = $el.attr('href');
        if (!href) {
          this.logger.warn(`Element ${index} has no href attribute`);
          return;
        }

        const listing = this.buildListingFromListAm($el, href, baseUrl);
        if (listing && !seenIds.has(listing.id)) {
          seenIds.add(listing.id);
          listings.push(listing);
          this.logger.debug(
            `Parsed listing ${listings.length}: "${listing.title}" (${listing.id})`,
          );
        }
      } catch (error) {
        this.logger.error(`Error parsing listing element ${index}:`, error);
      }
    });

    this.logger.debug(
      `Extraction complete. Total listings parsed: ${listings.length}`,
    );

    return listings;
  }

  private buildListingFromListAm(
    $el: CheerioElement,
    href: string,
    baseUrl: string,
  ): Listing | null {
    const urlObj = new URL(href, baseUrl);
    urlObj.search = '';
    const fullUrl = urlObj.toString();
    const id = this.extractListingId(fullUrl, href);

    const title = this.getTextContent($el.find('.dltitle .pt').first());
    if (!title) {
      return null;
    }

    const priceText =
      this.getTextContent($el.find('.ad-info-line-wrapper .p').first()) ||
      undefined;

    const locationText = this.extractLocationFromAt($el);

    const postedAtText =
      this.getTextContent($el.find('.d').first()) || undefined;

    const imageUrl = this.extractImageUrlFromListAm($el, baseUrl);

    return {
      id,
      title,
      priceText,
      priceValue: this.parsePriceValue(priceText),
      locationText,
      url: fullUrl,
      imageUrl,
      postedAtText,
    };
  }

  private extractListingId(fullUrl: string, href: string): string {
    const idMatch = href.match(/\/item\/(\d+)/);
    if (idMatch?.[1]) {
      return idMatch[1];
    }
    return this.hashUrl(fullUrl);
  }

  private extractImageUrlFromListAm(
    $el: CheerioElement,
    baseUrl: string,
  ): string | undefined {
    const $img = $el.find('img').first();
    const src =
      $img.attr('data-original') || $img.attr('src') || $img.attr('data-src');

    if (!src) {
      return undefined;
    }

    if (src.startsWith('//')) {
      return `https:${src}`;
    }

    try {
      return new URL(src, baseUrl).toString();
    } catch {
      return undefined;
    }
  }

  private extractLocationFromAt($el: CheerioElement): string | undefined {
    const atElements = $el.find('.at');

    for (let i = 0; i < atElements.length; i++) {
      const text = this.getTextContent(atElements.eq(i));

      if (text.startsWith('Подходит для') || text.startsWith('Suitable for')) {
        continue;
      }

      if (text.includes(',') && (text.includes('г.') || text.includes('км'))) {
        continue;
      }

      if (text && text.length < 50) {
        return text;
      }
    }

    return undefined;
  }

  private getTextContent($el: CheerioElement): string {
    return $el.text().trim();
  }

  private parsePriceValue(priceText?: string): number | null {
    if (!priceText) {
      return null;
    }

    const cleaned = priceText.replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(/,/g, '.');
    const value = parseFloat(normalized);

    return isNaN(value) ? null : value;
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex').substring(0, 32);
  }

  buildSearchUrl(baseUrl: string, query: string): string {
    if (this.isUrl(query)) {
      this.logger.debug(`Using URL subscription directly: ${query}`);
      return query;
    }

    const url = new URL('/ru/category', baseUrl);
    url.searchParams.set('q', query);
    const searchUrl = url.toString();
    this.logger.debug(`Built search URL: ${searchUrl}`);
    return searchUrl;
  }

  private isUrl(text: string): boolean {
    try {
      const url = new URL(text);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

import { createHash } from 'crypto';

import { Injectable } from '@nestjs/common';
import { type CheerioAPI, type Cheerio, load } from 'cheerio';

import { Listing } from '@list-am-bot/common/types/listing.types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioElement = Cheerio<any>;

@Injectable()
export class ParserService {
  extractListings(html: string, baseUrl: string): Listing[] {
    const $ = load(html);
    const listings: Listing[] = [];
    const seenIds = new Set<string>();

    this.extractFromLinks($, listings, seenIds, baseUrl);
    this.extractFromBlocks($, listings, seenIds, baseUrl);

    return listings;
  }

  private extractFromLinks(
    $: CheerioAPI,
    listings: Listing[],
    seenIds: Set<string>,
    baseUrl: string,
  ): void {
    $('a[href*="/item/"]').each((_, element): void => {
      try {
        const $el = $(element);
        const href = $el.attr('href');
        if (!href) return;

        const listing = this.buildListing($el, href, baseUrl);
        if (listing && !seenIds.has(listing.id)) {
          seenIds.add(listing.id);
          listings.push(listing);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing listing element:', error);
      }
    });
  }

  private extractFromBlocks(
    $: CheerioAPI,
    listings: Listing[],
    seenIds: Set<string>,
    baseUrl: string,
  ): void {
    $('.dl, .gl-i, .list-item, .item').each((_, element): void => {
      try {
        const $el = $(element);
        const $link = $el.find('a[href*="/item/"]').first();
        const href = $link.attr('href');
        if (!href) return;

        const $titleSource = $link.length > 0 ? $link : $el;
        const listing = this.buildListing($titleSource, href, baseUrl, $el);

        if (listing && !seenIds.has(listing.id)) {
          seenIds.add(listing.id);
          listings.push(listing);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error parsing listing block:', error);
      }
    });
  }

  private buildListing(
    $titleEl: CheerioElement,
    href: string,
    baseUrl: string,
    $contentEl?: CheerioElement,
  ): Listing | null {
    const fullUrl = new URL(href, baseUrl).toString();
    const id = this.extractListingId(fullUrl, href);
    const title = this.extractTitle($titleEl);

    if (!title) return null;

    const $el = $contentEl || $titleEl;

    return {
      id,
      title,
      priceText: this.extractPrice($el),
      priceValue: this.parsePriceValue(this.extractPrice($el)),
      locationText: this.extractLocation($el),
      url: fullUrl,
      imageUrl: this.extractImageUrl($el, baseUrl),
      postedAtText: this.extractPostedAt($el),
    };
  }

  private extractListingId(fullUrl: string, href: string): string {
    const idMatch = href.match(/\/item\/(\d+)/);
    if (idMatch?.[1]) {
      return idMatch[1];
    }
    return this.hashUrl(fullUrl);
  }

  private extractTitle($el: CheerioElement): string {
    const titleSelectors = [
      '.gl-title',
      '.title',
      '.item-title',
      '.name',
      'h2',
      'h3',
      '.l-title',
    ];

    for (const selector of titleSelectors) {
      const text = this.getTextContent($el.find(selector).first());
      if (text) return text;
    }

    const fallbackText = this.getTextContent($el);
    return fallbackText.substring(0, 200);
  }

  private extractPrice($el: CheerioElement): string | undefined {
    const priceSelectors = [
      '.price',
      '.item-price',
      '.gl-price',
      '.l-price',
      '.cost',
      '[class*="price"]',
    ];

    return this.findTextBySelectors($el, priceSelectors);
  }

  private extractLocation($el: CheerioElement): string | undefined {
    const locationSelectors = [
      '.location',
      '.item-location',
      '.gl-location',
      '.l-location',
      '.address',
      '[class*="location"]',
    ];

    return this.findTextBySelectors($el, locationSelectors);
  }

  private extractImageUrl(
    $el: CheerioElement,
    baseUrl: string,
  ): string | undefined {
    const $img = $el.find('img').first();
    const src = $img.attr('src') || $img.attr('data-src');

    if (!src) return undefined;

    try {
      return new URL(src, baseUrl).toString();
    } catch {
      return undefined;
    }
  }

  private extractPostedAt($el: CheerioElement): string | undefined {
    const dateSelectors = [
      '.date',
      '.item-date',
      '.gl-date',
      '.l-date',
      '.time',
      '[class*="date"]',
    ];

    return this.findTextBySelectors($el, dateSelectors);
  }

  private findTextBySelectors(
    $el: CheerioElement,
    selectors: string[],
  ): string | undefined {
    for (const selector of selectors) {
      const text = this.getTextContent($el.find(selector).first());
      if (text) return text;
    }
    return undefined;
  }

  private getTextContent($el: CheerioElement): string {
    return $el.text().trim();
  }

  private parsePriceValue(priceText?: string): number | null {
    if (!priceText) return null;

    const cleaned = priceText.replace(/[^\d.,]/g, '');
    const normalized = cleaned.replace(/,/g, '.');
    const value = parseFloat(normalized);

    return isNaN(value) ? null : value;
  }

  private hashUrl(url: string): string {
    return createHash('sha256').update(url).digest('hex').substring(0, 32);
  }

  buildSearchUrl(baseUrl: string, query: string): string {
    const url = new URL(baseUrl);
    url.searchParams.set('w', '1');
    url.searchParams.set('query', query);
    return url.toString();
  }
}

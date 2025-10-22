import { createHash } from 'crypto';
import { writeFileSync } from 'fs';

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

    // Debug: save HTML to file for inspection
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `/tmp/list-am-${timestamp}.html`;
      writeFileSync(filename, html);
      this.logger.debug(`HTML saved to ${filename} for inspection`);
    } catch (error) {
      this.logger.warn('Failed to save HTML to file:', error);
    }

    const $ = load(html);
    const listings: Listing[] = [];
    const seenIds = new Set<string>();

    // Debug: Try different selectors to see what's on the page
    const allLinks = $('a[href*="/item/"]');
    const favContainers = $('a.fav-item-info-container');
    const itemLinks = $('a.fav-item-info-container[href*="/item/"]');

    this.logger.debug(`Total links with /item/: ${allLinks.length}`);
    this.logger.debug(
      `Elements with class fav-item-info-container: ${favContainers.length}`,
    );
    this.logger.debug(`Combined selector matches: ${itemLinks.length}`);

    // Check page title to confirm we're on the right page
    const pageTitle = $('title').text();
    this.logger.debug(`Page title: "${pageTitle}"`);

    // list.am uses specific structure: <a class="fav-item-info-container">
    const elements = $('a.fav-item-info-container[href*="/item/"]');
    this.logger.debug(
      `Found ${elements.length} listing elements with selector 'a.fav-item-info-container[href*="/item/"]'`,
    );

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
    // Build URL and remove query parameters
    const urlObj = new URL(href, baseUrl);
    urlObj.search = ''; // Remove all query parameters like ?ld_src=2
    const fullUrl = urlObj.toString();
    const id = this.extractListingId(fullUrl, href);

    // Extract title from .dltitle .pt
    const title = this.getTextContent($el.find('.dltitle .pt').first());
    if (!title) return null;

    // Extract price from .ad-info-line-wrapper .p
    const priceText =
      this.getTextContent($el.find('.ad-info-line-wrapper .p').first()) ||
      undefined;

    // Extract location from .at elements (there can be multiple, we want the one that looks like a location)
    const locationText = this.extractLocationFromAt($el);

    // Extract date from .d
    const postedAtText =
      this.getTextContent($el.find('.d').first()) || undefined;

    // Extract image from img with data-original attribute
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

  private extractImageUrlFromListAm(
    $el: CheerioElement,
    baseUrl: string,
  ): string | undefined {
    const $img = $el.find('img').first();
    // list.am uses data-original attribute for lazy loading
    const src =
      $img.attr('data-original') || $img.attr('src') || $img.attr('data-src');

    if (!src) return undefined;

    // list.am uses protocol-relative URLs like //s.list.am/...
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
    // list.am has multiple .at elements - some contain location, some contain other info
    // Location is typically a standalone city name
    const atElements = $el.find('.at');

    for (let i = 0; i < atElements.length; i++) {
      const text = this.getTextContent(atElements.eq(i));

      // Skip elements that start with "Подходит для" (Suitable for)
      if (text.startsWith('Подходит для') || text.startsWith('Suitable for')) {
        continue;
      }

      // Skip elements that contain detailed car info (year, km, fuel type)
      if (text.includes(',') && (text.includes('г.') || text.includes('км'))) {
        continue;
      }

      // This is likely a location
      if (text && text.length < 50) {
        return text;
      }
    }

    return undefined;
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
    // list.am uses /ru/category?q=search+terms format (with language prefix)
    const url = new URL('/ru/category', baseUrl);
    url.searchParams.set('q', query);
    const searchUrl = url.toString();
    this.logger.debug(`Built search URL: ${searchUrl}`);
    return searchUrl;
  }
}

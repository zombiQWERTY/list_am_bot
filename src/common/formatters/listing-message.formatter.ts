import { Listing } from '@list-am-bot/common/types/listing.types';
import { escapeHtml } from '@list-am-bot/common/utils/html.util';

export interface ListingMessageOptions {
  includeQuery?: boolean;
  query?: string;
}

/**
 * Format listing data into a Telegram message
 */
export class ListingMessageFormatter {
  static format(listing: Listing, options: ListingMessageOptions = {}): string {
    const parts: string[] = [];

    if (options.includeQuery && options.query) {
      parts.push(
        `🔔 <b>Новое объявление</b> по запросу: "${escapeHtml(options.query)}"`,
        '',
      );
    }

    parts.push(`<b>${escapeHtml(listing.title)}</b>`);

    if (listing.priceText) {
      parts.push(`💰 Цена: ${escapeHtml(listing.priceText)}`);
    }

    if (listing.locationText) {
      parts.push(`📍 Локация: ${escapeHtml(listing.locationText)}`);
    }

    if (listing.postedAtText) {
      parts.push(`🕐 Время: ${escapeHtml(listing.postedAtText)}`);
    }

    parts.push('', `🔗 ${listing.url}`);

    return parts.join('\n');
  }
}

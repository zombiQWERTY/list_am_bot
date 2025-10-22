export type TelegramUserId = number;

export interface Listing {
  id: string;
  title: string;
  priceText?: string;
  priceValue?: number | null;
  locationText?: string;
  url: string;
  imageUrl?: string;
  postedAtText?: string;
}

export interface ScrapeResult {
  query: string;
  listings: Listing[];
  fetchedAt: Date;
}

export interface NotificationPayload {
  userTelegramId: TelegramUserId;
  subscriptionId: number;
  query: string;
  listing: Listing;
}

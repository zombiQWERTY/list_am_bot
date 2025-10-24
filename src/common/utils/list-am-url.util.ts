export class ListAmUrlUtil {
  private static readonly LIST_AM_DOMAIN = 'list.am';
  private static readonly LIST_AM_DOMAINS = [
    'list.am',
    'www.list.am',
    'https://list.am',
    'https://www.list.am',
  ];

  static isValidListAmUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname === 'list.am' || urlObj.hostname === 'www.list.am';
    } catch {
      return false;
    }
  }

  static normalizeUrl(url: string): string {
    let normalized = url.trim();

    if (
      !normalized.startsWith('http://') &&
      !normalized.startsWith('https://')
    ) {
      normalized = `https://${normalized}`;
    }

    const urlObj = new URL(normalized);

    if (!this.isValidListAmUrl(normalized)) {
      throw new Error('URL must be from list.am domain');
    }

    return urlObj.href.replace(/\/$/, '');
  }

  static extractQueryFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);

      const query = urlObj.searchParams.get('q');
      if (query && query.trim()) {
        return query.trim();
      }

      return null;
    } catch {
      return null;
    }
  }

  static isCategoryUrl(url: string): boolean {
    return this.extractQueryFromUrl(url) === null;
  }

  static isValidSubscriptionName(name: string): boolean {
    const trimmed = name.trim();
    return trimmed.length >= 3 && trimmed.length <= 100;
  }
}

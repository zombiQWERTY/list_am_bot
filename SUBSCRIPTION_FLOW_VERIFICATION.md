# Verification: Subscription Flow

This document verifies the complete flow for both subscription types (TEXT QUERY and URL).

## 📊 Flow Overview

```
User Input → Scene → SubscriptionService → Database
                          ↓
                    initializeSubscription (async, fire-and-forget)
                          ↓
                   ScrapeWorkerService
                          ↓
                    ScraperService
                          ↓
                    ParserService.buildSearchUrl
                          ↓
                    FlareSolverr.fetchHtml
                          ↓
                    ParserService.extractListings
                          ↓
                    Mark as seen
```

## ✅ Type 1: Text Query Subscription (SubscriptionType.QUERY)

### Step 1: User creates subscription

**User input:** `"iPhone 13"`

### Step 2: Bot scene processes input

- File: `src/interfaces/bot/scenes/add-subscription.scene.ts:65`
- Code: `await this.subscriptionService.create(user.id, text)`

### Step 3: SubscriptionService creates entity

- File: `src/application/subscription/subscription.service.ts:45-49`
- Code:

```typescript
return this.subscriptionRepository.create({
  userId,
  query: trimmedQuery, // ← "iPhone 13"
  type: SubscriptionType.QUERY,
});
```

**Database record:**

```json
{
  "userId": 1,
  "query": "iPhone 13",
  "type": "query",
  "isActive": true
}
```

### Step 4: Initialize subscription (async)

- File: `src/interfaces/bot/scenes/add-subscription.scene.ts:113-114`
- Code: `this.scrapeWorkerService.initializeSubscription(subscriptionId, query)`
- Parameters: `subscriptionId=1, query="iPhone 13"`

### Step 5: ScrapeWorkerService calls ScraperService

- File: `src/application/scheduler/scrape-worker.service.ts:38`
- Code: `await this.scraperService.scrapeQuery(query)`
- Parameter: `query="iPhone 13"`

### Step 6: ScraperService calls ParserService

- File: `src/infrastructure/scraper/scraper.service.ts:33`
- Code: `const searchUrl = this.parser.buildSearchUrl(this.baseUrl, query)`
- Parameters: `baseUrl="https://www.list.am", query="iPhone 13"`

### Step 7: ParserService builds search URL

- File: `src/infrastructure/scraper/parser.service.ts:164-177`
- Code:

```typescript
buildSearchUrl(baseUrl: string, query: string): string {
  if (this.isUrl(query)) {
    this.logger.debug(`Using URL subscription directly: ${query}`);
    return query;
  }

  // For text query: build search URL
  const url = new URL('/ru/category', baseUrl);
  url.searchParams.set('q', query);
  const searchUrl = url.toString();
  this.logger.debug(`Built search URL: ${searchUrl}`);
  return searchUrl;
}
```

**Result:** `"https://www.list.am/ru/category?q=iPhone+13"`

### Step 8: Fetch and parse

- FlareSolverr fetches: `https://www.list.am/ru/category?q=iPhone+13`
- Parser extracts listings from HTML
- Mark existing listings as "seen"

---

## ✅ Type 2: URL Subscription (SubscriptionType.URL)

### Step 1: User creates subscription

**User input:** `"https://www.list.am/category/134?cnd=2&price2=30000&srt=3"`
**Name:** `"Квартиры до 30000"`

### Step 2: Bot scene processes input

- File: `src/interfaces/bot/scenes/add-url-subscription.scene.ts:120-124`
- Code: `await this.subscriptionService.createFromUrl(user.id, url, text)`

### Step 3: SubscriptionService creates entity

- File: `src/application/subscription/subscription.service.ts:83-88`
- Code:

```typescript
return this.subscriptionRepository.create({
  userId,
  query: normalizedUrl, // ← Full URL with all filters!
  name: name.trim(),
  type: SubscriptionType.URL,
});
```

**Database record:**

```json
{
  "userId": 1,
  "query": "https://www.list.am/category/134?cnd=2&price2=30000&srt=3",
  "name": "Квартиры до 30000",
  "type": "url",
  "isActive": true
}
```

### Step 4: Initialize subscription (async)

- Similar to Type 1
- Parameters: `subscriptionId=2, query="https://www.list.am/category/134?cnd=2&price2=30000&srt=3"`

### Step 5: ScrapeWorkerService calls ScraperService

- File: `src/application/scheduler/scrape-worker.service.ts:38`
- Code: `await this.scraperService.scrapeQuery(query)`
- Parameter: `query="https://www.list.am/category/134?cnd=2&price2=30000&srt=3"`

### Step 6: ScraperService calls ParserService

- File: `src/infrastructure/scraper/scraper.service.ts:33`
- Code: `const searchUrl = this.parser.buildSearchUrl(this.baseUrl, query)`
- Parameters: `baseUrl="https://www.list.am", query="https://www.list.am/category/134?cnd=2&price2=30000&srt=3"`

### Step 7: ParserService detects URL and uses it directly

- File: `src/infrastructure/scraper/parser.service.ts:164-177`
- Code:

```typescript
buildSearchUrl(baseUrl: string, query: string): string {
  if (this.isUrl(query)) {  // ← TRUE for URLs!
    this.logger.debug(`Using URL subscription directly: ${query}`);
    return query;  // ← Returns URL unchanged!
  }
  // ... text query code not executed
}
```

**Result:** `"https://www.list.am/category/134?cnd=2&price2=30000&srt=3"`

### Step 8: Fetch and parse

- FlareSolverr fetches: `https://www.list.am/category/134?cnd=2&price2=30000&srt=3`
- **All filter parameters preserved:** `cnd=2`, `price2=30000`, `srt=3`
- Parser extracts listings from HTML
- Mark existing listings as "seen"

---

## 🔄 Scheduled Scraping (Cron Job)

### Step 1: Worker fetches active subscriptions

- File: `src/application/scheduler/scrape-worker.service.ts:95-96`
- Code: `await this.subscriptionService.findActiveByUserId(user.id)`

### Step 2: Worker iterates through subscriptions

- File: `src/application/scheduler/scrape-worker.service.ts:108-114`
- Code:

```typescript
for (const subscription of subscriptions) {
  try {
    await delay(jitter(this.requestDelayMs));

    const scrapeResult = await this.scraperService.scrapeQuery(
      subscription.query  // ← Uses query field from DB!
    );
```

**For TEXT subscription:** `subscription.query = "iPhone 13"`
**For URL subscription:** `subscription.query = "https://www.list.am/category/134?..."`

### Step 3: Same flow as initialization

- Both types follow the same path through ScraperService → ParserService
- ParserService automatically detects if query is a URL
- Text queries → build search URL with `q` parameter
- URL queries → use URL directly

### Step 4: Filter new listings

- File: `src/application/scheduler/scrape-worker.service.ts:117-120`
- Code:

```typescript
const newListings = await this.scraperService.filterNewListings(
  subscription.id,
  scrapeResult.listings,
);
```

### Step 5: Send notifications

- File: `src/application/scheduler/scrape-worker.service.ts:127-136`
- Code: Sends notification for each new listing

---

## ✅ Key Implementation Details

### 1. URL Detection Logic

- File: `src/infrastructure/scraper/parser.service.ts:179-186`
- Code:

```typescript
private isUrl(text: string): boolean {
  try {
    const url = new URL(text);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}
```

**Why this works:**

- Text like `"iPhone 13"` → `new URL()` throws error → returns `false`
- URL like `"https://..."` → `new URL()` succeeds → returns `true`

### 2. Unified Storage

Both subscription types store data in the SAME field (`query`):

- **QUERY type:** stores search text
- **URL type:** stores full URL with all parameters

This is the KEY insight that makes the system work!

### 3. Automatic Detection

The `buildSearchUrl` method automatically detects the type:

- If `query` is a URL → use it directly
- If `query` is text → build search URL

No need to check `subscription.type` field!

---

## 🧪 Test Coverage

### Integration Tests

File: `src/infrastructure/scraper/__tests__/subscription-flow.integration.spec.ts`

**Covers:**

- ✅ Text query builds correct search URL
- ✅ URL subscription is used directly
- ✅ All URL parameters are preserved (cnd, price2, srt, \_ssid, etc.)
- ✅ Text query vs URL detection
- ✅ Both http and https protocols

**Test count:** 14 tests, all passing

### Unit Tests

**ParserService:**

- File: `src/infrastructure/scraper/__tests__/parser.service.spec.ts`
- Tests: 34 passing

**ScraperService:**

- File: `src/infrastructure/scraper/__tests__/scraper.service.spec.ts`
- Tests: All passing

**ScrapeWorkerService:**

- File: `src/application/scheduler/__tests__/scrape-worker.service.spec.ts`
- Tests: All passing

---

## ✅ Verification Checklist

- [x] Text subscriptions store text in `query` field
- [x] URL subscriptions store full URL in `query` field
- [x] URL subscriptions preserve ALL filter parameters
- [x] Worker correctly passes `subscription.query` to scraper
- [x] ScraperService passes query to ParserService unchanged
- [x] ParserService correctly detects URLs vs text
- [x] Text queries build search URL with `q` parameter
- [x] URL queries are used directly without modification
- [x] Both types work with scheduled scraping
- [x] New listings are correctly filtered
- [x] Notifications are sent for new listings
- [x] All tests passing (48+ tests)
- [x] No linter errors
- [x] Type safety maintained throughout

---

## 🎯 Conclusion

**Both subscription types work correctly:**

1. **TEXT QUERY**: Text → Build search URL → Fetch → Parse
2. **URL**: URL → Use directly → Fetch → Parse

The key insight is that both types store their data in the `query` field, and the `buildSearchUrl` method automatically detects and handles both cases correctly.

**The fix applied:**

- Added URL detection in `ParserService.buildSearchUrl()`
- URLs are now used directly instead of being treated as search text
- All filter parameters (price, condition, sort, etc.) are now preserved

**Result:** URL subscriptions now work as intended! 🎉

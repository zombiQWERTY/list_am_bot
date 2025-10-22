import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { delay, jitter } from '@list-am-bot/common/utils/delay.util';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

@Injectable()
export class ScrapeWorkerService {
  private isRunning = false;
  private readonly requestDelayMs: number;

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly scraperService: ScraperService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
  ) {
    this.requestDelayMs = this.configService.get<number>(
      'requestDelayMs',
      2500,
    );
  }

  async runCycle(): Promise<void> {
    if (this.isRunning) {
      // eslint-disable-next-line no-console
      console.warn('Scrape cycle is already running, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      // eslint-disable-next-line no-console
      console.log('Starting scrape cycle...');

      const activeUsers = await this.userService.findAllActive();
      // eslint-disable-next-line no-console
      console.log(`Found ${activeUsers.length} active users`);

      let totalNewListings = 0;
      let totalRequests = 0;
      let totalErrors = 0;

      for (const user of activeUsers) {
        try {
          const subscriptions =
            await this.subscriptionService.findActiveByUserId(user.id);

          if (subscriptions.length === 0) {
            continue;
          }

          // eslint-disable-next-line no-console
          console.log(
            `Processing ${subscriptions.length} subscriptions for user ${user.telegramUserId}`,
          );

          for (const subscription of subscriptions) {
            try {
              await delay(jitter(this.requestDelayMs));

              const scrapeResult = await this.scraperService.scrapeQuery(
                subscription.query,
              );
              totalRequests++;

              const newListings = await this.scraperService.filterNewListings(
                subscription.id,
                scrapeResult.listings,
              );

              if (newListings.length > 0) {
                // eslint-disable-next-line no-console
                console.log(
                  `Found ${newListings.length} new listings for subscription "${subscription.query}"`,
                );

                for (const listing of newListings) {
                  await this.notificationService.sendListingNotification({
                    userTelegramId: user.telegramUserId,
                    subscriptionId: subscription.id,
                    query: subscription.query,
                    listing,
                  });

                  await delay(100);
                }

                await this.scraperService.markListingsAsSeen(
                  subscription.id,
                  newListings,
                );
                totalNewListings += newListings.length;
              }
            } catch (error) {
              totalErrors++;
              // eslint-disable-next-line no-console
              console.error(
                `Error processing subscription ${subscription.id} (${subscription.query}):`,
                error,
              );
            }
          }
        } catch (error) {
          totalErrors++;
          // eslint-disable-next-line no-console
          console.error(`Error processing user ${user.telegramUserId}:`, error);
        }
      }

      const duration = Date.now() - startTime;
      // eslint-disable-next-line no-console
      console.log(
        `Scrape cycle completed in ${duration}ms. ` +
          `Requests: ${totalRequests}, New listings: ${totalNewListings}, Errors: ${totalErrors}`,
      );
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Fatal error in scrape cycle:', error);
    } finally {
      this.isRunning = false;
    }
  }
}

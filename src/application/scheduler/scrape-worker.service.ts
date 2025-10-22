import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { NotificationService } from '@list-am-bot/application/notification/notification.service';
import {
  ScrapeQueueService,
  ScrapePriority,
} from '@list-am-bot/application/scheduler/scrape-queue.service';
import { SubscriptionService } from '@list-am-bot/application/subscription/subscription.service';
import { UserService } from '@list-am-bot/application/user/user.service';
import { delay, jitter } from '@list-am-bot/common/utils/delay.util';
import { ScraperService } from '@list-am-bot/infrastructure/scraper/scraper.service';

@Injectable()
export class ScrapeWorkerService {
  private readonly logger = new Logger(ScrapeWorkerService.name);
  private readonly requestDelayMs: number;

  constructor(
    private readonly userService: UserService,
    private readonly subscriptionService: SubscriptionService,
    private readonly scraperService: ScraperService,
    private readonly notificationService: NotificationService,
    private readonly configService: ConfigService,
    private readonly scrapeQueue: ScrapeQueueService,
  ) {
    this.requestDelayMs = this.configService.get<number>(
      'requestDelayMs',
      2500,
    );
  }

  async initializeSubscription(
    subscriptionId: number,
    query: string,
  ): Promise<void> {
    try {
      this.logger.log(
        `Initializing subscription ${subscriptionId}: "${query}"`,
      );

      const scrapeResult = await this.scraperService.scrapeQuery(query);

      if (scrapeResult.listings.length > 0) {
        await this.scraperService.markListingsAsSeen(
          subscriptionId,
          scrapeResult.listings,
        );

        this.logger.log(
          `✅ Initialized subscription "${query}" with ${scrapeResult.listings.length} existing listings marked as seen`,
        );
      } else {
        this.logger.log(
          `ℹ️  No existing listings found for subscription "${query}"`,
        );
      }
    } catch (error) {
      this.logger.error(
        `❌ Failed to initialize subscription ${subscriptionId} (${query}):`,
        error,
      );
    }
  }

  /**
   * Run scrape cycle through queue
   * This is queued with LOW priority (cron job)
   */
  runCycle(): void {
    const taskId = `cron-${Date.now()}`;

    // Check if already queued
    if (this.scrapeQueue.isTaskQueued(taskId)) {
      this.logger.warn('Scrape cycle already queued, skipping...');
      return;
    }

    this.scrapeQueue.addTask(
      taskId,
      ScrapePriority.CRON_JOB,
      async (): Promise<void> => {
        await this.executeCycle();
      },
    );
  }

  /**
   * Execute the actual scrape cycle
   */
  private async executeCycle(): Promise<void> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting scrape cycle...');

      const activeUsers = await this.userService.findAllActive();
      this.logger.log(`Found ${activeUsers.length} active users`);

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

          this.logger.log(
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
                this.logger.log(
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
              this.logger.error(
                `Error processing subscription ${subscription.id} (${subscription.query}):`,
                error,
              );
            }
          }
        } catch (error) {
          totalErrors++;
          this.logger.error(
            `Error processing user ${user.telegramUserId}:`,
            error,
          );
        }
      }

      const duration = Date.now() - startTime;
      this.logger.log(
        `Scrape cycle completed in ${duration}ms. ` +
          `Requests: ${totalRequests}, New listings: ${totalNewListings}, Errors: ${totalErrors}`,
      );
    } catch (error) {
      this.logger.error('Fatal error in scrape cycle:', error);
    }
  }

  /**
   * Scrape a single query (for user requests like /last command)
   * This is queued with MEDIUM priority
   */
  async scrapeQueryForUser(
    userId: number,
    query: string,
  ): Promise<{ listings: unknown[]; error?: string }> {
    const taskId = `user-${userId}-${Date.now()}`;

    return new Promise(
      (
        resolve: (value: { listings: unknown[]; error?: string }) => void,
      ): void => {
        this.scrapeQueue.addTask(
          taskId,
          ScrapePriority.USER_REQUEST,
          async (): Promise<void> => {
            try {
              this.logger.log(`User ${userId} requested scrape: "${query}"`);
              const result = await this.scraperService.scrapeQuery(query);
              resolve({ listings: result.listings });
            } catch (error) {
              this.logger.error(`Failed to scrape for user ${userId}:`, error);
              resolve({
                listings: [],
                error:
                  error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
              });
            }
          },
        );
      },
    );
  }
}

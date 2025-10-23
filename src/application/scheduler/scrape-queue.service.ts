import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { delay } from '@list-am-bot/common/utils/delay.util';

export enum ScrapePriority {
  INITIALIZATION = 1, // New subscription initialization (highest priority)
  USER_REQUEST = 2, // User /last command
  CRON_JOB = 3, // Scheduled cron job (lowest priority)
}

export interface ScrapeTask {
  id: string;
  priority: ScrapePriority;
  taskFn: () => Promise<void>;
  addedAt: Date;
}

@Injectable()
export class ScrapeQueueService implements OnModuleInit {
  private readonly logger = new Logger(ScrapeQueueService.name);
  private queue: ScrapeTask[] = [];
  private isProcessing = false;
  private currentTask: ScrapeTask | null = null;

  onModuleInit(): void {
    this.logger.log('✅ Scrape Queue Service initialized');
    this.processQueue().catch((error): void => {
      this.logger.error('Fatal error in queue processor:', error);
    });
  }

  addTask(
    taskId: string,
    priority: ScrapePriority,
    taskFn: () => Promise<void>,
  ): void {
    const task: ScrapeTask = {
      id: taskId,
      priority,
      taskFn,
      addedAt: new Date(),
    };

    const existingIndex = this.queue.findIndex((t): boolean => t.id === taskId);
    if (existingIndex !== -1) {
      this.logger.debug(
        `Task ${taskId} already in queue, replacing with newer version`,
      );
      this.queue.splice(existingIndex, 1);
    }

    this.queue.push(task);
    this.queue.sort((a, b): number => a.priority - b.priority);

    this.logger.debug(
      `Task added: ${taskId} (priority: ${priority}, queue size: ${this.queue.length})`,
    );
  }

  getStatus(): {
    queueSize: number;
    isProcessing: boolean;
    currentTask: string | null;
    tasks: Array<{ id: string; priority: number; waitTime: number }>;
  } {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
      currentTask: this.currentTask?.id || null,
      tasks: this.queue.map(
        (task): { id: string; priority: number; waitTime: number } => ({
          id: task.id,
          priority: task.priority,
          waitTime: Date.now() - task.addedAt.getTime(),
        }),
      ),
    };
  }

  private async processQueue(): Promise<void> {
    while (true) {
      try {
        await delay(100);

        if (this.isProcessing || this.queue.length === 0) {
          continue;
        }

        const task = this.queue.shift();
        if (!task) {
          continue;
        }

        this.isProcessing = true;
        this.currentTask = task;

        const waitTime = Date.now() - task.addedAt.getTime();
        this.logger.debug(
          `Processing task: ${task.id} (waited: ${Math.round(waitTime / 1000)}s, remaining: ${this.queue.length})`,
        );

        const startTime = Date.now();

        try {
          await task.taskFn();
          const duration = Date.now() - startTime;
          this.logger.debug(
            `✅ Task completed: ${task.id} (took: ${Math.round(duration / 1000)}s)`,
          );
        } catch (error) {
          this.logger.error(`❌ Task failed: ${task.id}`, error);
        }
      } catch (error) {
        this.logger.error('Error in queue processor:', error);
      } finally {
        this.isProcessing = false;
        this.currentTask = null;
      }
    }
  }

  clearQueue(): void {
    const cleared = this.queue.length;
    this.queue = [];
    this.logger.warn(`Queue cleared: ${cleared} tasks removed`);
  }

  isTaskQueued(taskId: string): boolean {
    return (
      this.queue.some((t): boolean => t.id === taskId) ||
      this.currentTask?.id === taskId
    );
  }
}

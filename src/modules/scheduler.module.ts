import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { SchedulerService } from '@list-am-bot/infrastructure/scheduler/scheduler.service';
import { BotModule } from '@list-am-bot/modules/bot.module';
import { WorkerModule } from '@list-am-bot/modules/worker.module';

@Module({
  imports: [ScheduleModule.forRoot(), WorkerModule, BotModule],
  providers: [SchedulerService],
})
export class SchedulerAppModule {}

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

import { MetricsReportService } from '@list-am-bot/application/monitoring/metrics-report.service';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';
import { MetricsReportSchedulerService } from '@list-am-bot/infrastructure/scheduler/metrics-report-scheduler.service';
import { SchedulerService } from '@list-am-bot/infrastructure/scheduler/scheduler.service';
import { BotModule } from '@list-am-bot/modules/bot.module';
import { MonitoringModule } from '@list-am-bot/modules/monitoring.module';
import { WorkerModule } from '@list-am-bot/modules/worker.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    WorkerModule,
    BotModule,
    MonitoringModule,
    TypeOrmDatabaseModule,
  ],
  providers: [
    SchedulerService,
    MetricsReportService,
    MetricsReportSchedulerService,
  ],
})
export class SchedulerAppModule {}

import { Module } from '@nestjs/common';

import { MetricsService } from '@list-am-bot/application/monitoring/metrics.service';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MonitoringModule {}

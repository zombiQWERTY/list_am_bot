import { Module } from '@nestjs/common';

import { UserService } from '@list-am-bot/application/user/user.service';
import { TypeOrmDatabaseModule } from '@list-am-bot/infrastructure/database/typeorm/typeorm-database.module';

@Module({
  imports: [TypeOrmDatabaseModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}

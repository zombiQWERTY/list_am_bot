// @important: DO NOT MOVE THIS FILE ANYWHERE

import {
  TypeOrmModuleAsyncOptions,
  TypeOrmModuleOptions,
} from '@nestjs/typeorm/dist/interfaces/typeorm-options.interface';
import { DataSource, DataSourceOptions } from 'typeorm';
import 'dotenv/config';

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  url: process.env.CORE_POSTGRES_URL,
  schema: process.env.CORE_POSTGRES_SCHEMA,
  entities: [__dirname + '/typeorm/entity-dtos/*.entity.dto.ts'],
  migrations: [__dirname + '/typeorm/migrations/*.ts'],
  synchronize: false,
  autoLoadEntities: true,
  migrationsRun: true,
};

export const databaseProvider: TypeOrmModuleAsyncOptions = {
  useFactory: (): TypeOrmModuleOptions => config,
};

export const connectionSource = new DataSource(config as DataSourceOptions);

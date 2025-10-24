import { Injectable, Inject } from '@nestjs/common';
import { Repository, MoreThanOrEqual } from 'typeorm';

import {
  MetricEntity,
  MetricType,
} from '@list-am-bot/domain/metric/metric.entity';
import { IMetricRepository } from '@list-am-bot/domain/metric/ports/metric.repository.port';
import { MetricEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/metric.entity.dto';
import { MetricMapper } from '@list-am-bot/infrastructure/database/typeorm/mappers/metric.mapper';
import { MetricProviderToken } from '@list-am-bot/infrastructure/database/typeorm/providers/metric.provider';

@Injectable()
export class MetricRepository implements IMetricRepository {
  constructor(
    @Inject(MetricProviderToken)
    private readonly repo: Repository<MetricEntityDto>,
  ) {}

  async create(
    type: MetricType,
    value: number,
    metadata?: Record<string, unknown>,
  ): Promise<MetricEntity> {
    const metric = this.repo.create({
      type,
      value,
      metadata: metadata || null,
    });

    const saved = await this.repo.save(metric);
    return MetricMapper.toDomain(saved);
  }

  async findByType(type: MetricType, limit = 100): Promise<MetricEntity[]> {
    const metrics = await this.repo.find({
      where: { type },
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return metrics.map(
      (metric: MetricEntityDto): MetricEntity => MetricMapper.toDomain(metric),
    );
  }

  async findRecent(limit: number): Promise<MetricEntity[]> {
    const metrics = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return metrics.map(
      (metric: MetricEntityDto): MetricEntity => MetricMapper.toDomain(metric),
    );
  }

  async getAverageByType(type: MetricType, since?: Date): Promise<number> {
    const where = since
      ? { type, createdAt: MoreThanOrEqual(since) }
      : { type };

    const result = await this.repo
      .createQueryBuilder('metric')
      .select('AVG(metric.value)', 'average')
      .where(where)
      .getRawOne<{ average: string }>();

    return result?.average ? parseFloat(result.average) : 0;
  }
}

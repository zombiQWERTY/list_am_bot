import { assignDefinedProps } from '@list-am-bot/common/utils/object.util';
import { MetricEntity } from '@list-am-bot/domain/metric/metric.entity';
import { MetricEntityDto } from '@list-am-bot/infrastructure/database/typeorm/entity-dtos/metric.entity.dto';

export class MetricMapper {
  static toDomain = (dto: MetricEntityDto): MetricEntity => {
    return new MetricEntity({
      id: dto.id,
      type: dto.type,
      value: Number(dto.value),
      createdAt: dto.createdAt,
      metadata: dto.metadata,
    });
  };

  static fromDomain(domain: MetricEntity): MetricEntityDto;
  static fromDomain(domain: Partial<MetricEntity>): Partial<MetricEntityDto>;
  static fromDomain(
    domain: MetricEntity | Partial<MetricEntity>,
  ): MetricEntityDto {
    const dto = new MetricEntityDto();

    assignDefinedProps(dto, domain, [
      'id',
      'type',
      'value',
      'createdAt',
      'metadata',
    ]);

    return dto;
  }
}

import { Type } from 'class-transformer';
import { IsInt, Min, IsOptional, Max, IsString } from 'class-validator';

export class PaginationQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  @IsOptional()
  limit?: number = 30;

  @IsString()
  @IsOptional()
  lastKey?: string;
}

export class PaginationResponseDto<T> {
  data: T[];
  count: number;
  lastKey?: string;

  constructor(items: T[], count: number, lastKey?: Record<string, any>) {
    this.data = items;
    this.count = count;
    if (lastKey) {
      this.lastKey = encodeURIComponent(Buffer.from(JSON.stringify(lastKey)).toString('base64'));
    }
  }
}

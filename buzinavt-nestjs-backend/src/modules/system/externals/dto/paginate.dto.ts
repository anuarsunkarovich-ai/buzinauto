import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class PaginateDto {
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiProperty({ maximum: 100, minimum: 1, default: 10 })
  limit = 10;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiProperty({ minimum: 1, default: 1 })
  page = 1;
}

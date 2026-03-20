import { ApiProperty } from '@nestjs/swagger';

export class PaginationResponse {
  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Number of items skipped',
    example: 20,
  })
  offset: number;

  @ApiProperty({
    description: 'Flag indicating if there is a next page',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Flag indicating if there is a previous page',
    example: false,
  })
  hasPrevPage: boolean;

  @ApiProperty({
    description: 'The number of the next page if it exists, or null',
    example: 3,
    nullable: true,
  })
  nextPage: number | null;

  @ApiProperty({
    description: 'The number of the previous page if it exists, or null',
    example: null,
    nullable: true,
  })
  prevPage: number | null;

  @ApiProperty({
    description: 'Current page number',
    example: 2,
  })
  page: number;
}

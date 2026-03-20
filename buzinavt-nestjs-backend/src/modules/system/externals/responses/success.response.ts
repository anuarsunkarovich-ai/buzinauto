import { ApiProperty } from '@nestjs/swagger';

export class SuccessResponse {
  @ApiProperty({ type: Boolean, example: true })
  ok: boolean;
}

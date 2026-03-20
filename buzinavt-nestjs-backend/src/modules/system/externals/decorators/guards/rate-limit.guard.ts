import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

export function RateLimitGuard() {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({ default: { limit: +process.env.RATE_LIMIT_APP_LIMIT, ttl: +process.env.RATE_LIMIT_APP_TTL } })
  );
}

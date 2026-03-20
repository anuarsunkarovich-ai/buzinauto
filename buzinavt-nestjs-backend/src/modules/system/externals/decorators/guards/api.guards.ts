import { applyDecorators, UseFilters, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiException } from '@system/externals/configurations/exception.config';
import { ApiExceptionResponse } from '../api-description/api-description.decorater';
import { HttpExceptionFilter } from '../filters/http-exception.filter';

export function ApiGuards() {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({ default: { limit: +process.env.RATE_LIMIT_APP_LIMIT, ttl: +process.env.RATE_LIMIT_APP_TTL } }),
    UseFilters(HttpExceptionFilter),
    ApiExceptionResponse(ApiException.Enum.UNAUTHORIZED),
    ApiExceptionResponse(ApiException.Enum.RATE_LIMIT),
    ApiExceptionResponse(ApiException.Enum.FORBIDDEN),
    ApiExceptionResponse(ApiException.Enum.BAD_REQUEST),
    ApiExceptionResponse(ApiException.Enum.SERVER_ERROR)
  );
}

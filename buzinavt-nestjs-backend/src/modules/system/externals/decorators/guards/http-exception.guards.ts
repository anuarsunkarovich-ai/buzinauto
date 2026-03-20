import { applyDecorators, UseFilters } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http-exception.filter';

export function HttpExceptionGuards() {
  return applyDecorators(UseFilters(HttpExceptionFilter));
}

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { ApiException, ApiExceptionConfig } from '../../configurations/exception.config';

type ExceptionType = Error | typeof ApiException.Of | ThrottlerException | BadRequestException;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: ExceptionType, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let status: number, body: ApiException.ExceptionResponse;

    if (!(exception instanceof UnauthorizedException)) {
      console.debug(exception);
    }

    if (exception instanceof ApiException.Of) {
      [status, body] = this.filterResponseError(request.id as string, exception.key, exception.vars);
    }
    if (exception instanceof ThrottlerException) {
      [status, body] = this.filterResponseError(request.id as string, ApiException.Enum.RATE_LIMIT);
    }
    if (exception instanceof UnauthorizedException) {
      [status, body] = this.filterResponseError(request.id as string, ApiException.Enum.UNAUTHORIZED);
    }
    if (exception instanceof ForbiddenException) {
      [status, body] = this.filterResponseError(request.id as string, ApiException.Enum.FORBIDDEN);
    }
    if (exception instanceof BadRequestException) {
      [status, body] = this.filterResponseError(request.id as string, ApiException.Enum.BAD_REQUEST);
      body['params'] = exception.getResponse()['message'] as string;
    }
    if (status === undefined) {
      [status, body] = this.filterResponseError(request.id as string, ApiException.Enum.SERVER_ERROR);
    }

    response.status(status).json(body);
  }

  private filterResponseError(
    requestId: string,
    key: ApiException.Enum,
    vars: string[] = []
  ): [number, ApiException.ExceptionResponse] {
    const { code, type, statusCode } = ApiExceptionConfig[key];
    let { message } = ApiExceptionConfig[key];
    for (const [i, _var] of vars.entries()) {
      message = message.replace(`$${i + 1}`, _var);
    }
    return [
      statusCode,
      {
        id: requestId,
        type,
        code,
        message,
      },
    ];
  }
}

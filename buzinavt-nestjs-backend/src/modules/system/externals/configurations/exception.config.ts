import { HttpStatus } from '@nestjs/common';
import { HttpApiException } from '../exceptions/api-exception.exception';

//#region "Типы"

export namespace ApiException {
  type Code = 'api_error' | 'invalid_request_error';

  export type Field = {
    type: Code;
    message: string;
    statusCode: number;
    code: string;
  };

  export type ExceptionResponse = {
    id: string;
    type: Code;
    code: string;
    message: string;
    params?: string | string[];
  };

  export enum Enum {
    UNAUTHORIZED = 'unauthorized',
    FORBIDDEN = 'forbidden',

    RATE_LIMIT = 'rate_limit',
    SERVER_ERROR = 'server_error',
    BAD_REQUEST = 'bad_request',
  }

  export const Of = HttpApiException;
}
//#endregion

export const ApiExceptionConfig: Record<ApiException.Enum, ApiException.Field> = {
  unauthorized: {
    type: 'invalid_request_error',
    code: 'unauthorized',
    statusCode: HttpStatus.UNAUTHORIZED,
    message: 'The user is not logged in.',
  },
  forbidden: {
    type: 'invalid_request_error',
    code: 'forbidden',
    statusCode: HttpStatus.FORBIDDEN,
    message: 'Insufficient access rights to the resource.',
  },
  rate_limit: {
    type: 'invalid_request_error',
    code: 'rate_limit',
    statusCode: 429,
    message: 'Too Many Requests.',
  },
  server_error: {
    type: 'api_error',
    code: 'server_error',
    statusCode: 500,
    message: 'Error on the server try again later.',
  },
  bad_request: {
    type: 'invalid_request_error',
    code: 'validate_error',
    statusCode: 400,
    message: 'Invalid parameters passed.',
  },
};

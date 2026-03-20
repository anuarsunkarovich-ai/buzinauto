import { ApiResponseSchemaHost } from '@nestjs/swagger';
import { ApiException } from '@system/externals/configurations/exception.config';

export function generateDescription(...exceptions: ApiException.Field[]): ApiResponseSchemaHost {
  const defaultExceptions = exceptions[0];
  let codeErrorText = '';

  let messageErrorText = '';
  for (let index = 0; index < exceptions.length; index++) {
    if (index !== exceptions.length - 1) {
      codeErrorText += exceptions[index].code + ' | ';
      messageErrorText += exceptions[index].message + ' | ';
    } else {
      codeErrorText += exceptions[index].code;
      messageErrorText += exceptions[index].message;
    }
  }
  return {
    status: defaultExceptions.statusCode,
    schema: {
      example: {
        id: 'string',
        code: codeErrorText,
        type: defaultExceptions.type,
        message: messageErrorText,
      },
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
        code: {
          type: 'string',
        },
        type: {
          type: 'string',
        },
        message: {
          type: 'string',
        },
        params: {
          type: 'string',
        },
        payload: {
          type: 'object',
          properties: {
            string: {
              type: 'string',
            },
          },
        },
      },
    },
    description: 'Error: ' + messageErrorText,
  };
}

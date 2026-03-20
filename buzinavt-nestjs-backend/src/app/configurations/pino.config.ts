import { Request, Response } from 'express';
import { Params } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';

export const PinoConfig: Params = {
  pinoHttp: {
    customErrorMessage: (_req: Request, _res: Response, error: Error) => {
      if (error?.name && error?.message) {
        return `Error (${error?.name}): ${error?.message};`;
      }
      return 'Error;';
    },
    genReqId: () => uuidv4(),
  },
};

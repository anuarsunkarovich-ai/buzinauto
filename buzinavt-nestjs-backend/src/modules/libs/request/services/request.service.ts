import { Either, left, right } from '@sweet-monads/either';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { IncomingMessage } from 'node:http';
import { InvalidLengthFileException } from '../exceptions/invalid-length-file.exception';
import { InvalidRequestService } from '../exceptions/invalid-request.service';

type Message = IncomingMessage & {
  responseUrl?: string;
} & NodeJS.ReadableStream;

export class RequestService {
  public async downloadFileByUrlSafe(
    url: string,
    config: AxiosRequestConfig = {}
  ): Promise<Either<InvalidLengthFileException | InvalidRequestService, Message>> {
    try {
      const downloadResponse: AxiosResponse<Message> = await axios({
        method: 'get',
        url: url,
        responseType: 'stream',
        timeout: 1000 * 60, // 1 minute
        ...config,
      });
      const contentLength = parseInt(downloadResponse.headers['content-length'] || '0', 10);

      if (contentLength < 100) {
        return left(new InvalidLengthFileException());
      }

      return right(downloadResponse.data);
    } catch (error) {
      return left(new InvalidRequestService());
    }
  }
}

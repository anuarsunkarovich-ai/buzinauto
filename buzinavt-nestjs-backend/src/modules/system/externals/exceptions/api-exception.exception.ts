import { HttpException, HttpStatus } from '@nestjs/common';
import { ApiException } from '../configurations/exception.config';

export class HttpApiException extends HttpException {
  #vars: string[];

  constructor(
    private readonly _key: ApiException.Enum,
    ...vars: string[]
  ) {
    super('ApiException', HttpStatus.SERVICE_UNAVAILABLE);
    this.#vars = vars;
  }

  public get vars(): string[] {
    return this.#vars;
  }
  public get key(): ApiException.Enum {
    return this._key;
  }
}

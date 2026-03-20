import { InvalidRequestService } from '@lib/request/exceptions/invalid-request.service';
import { Either, left, right } from '@sweet-monads/either';
import { ExchangeRate } from '../types/exchange-rate.type';
import { ExchangeRateRequestService } from './exchange-rate-request.service';
import { AxiosResponse } from 'axios';

export class ExchangeRateClientService {
  private readonly _request = new ExchangeRateRequestService();

  public async getLatestCurrencyRate(
    currency: ExchangeRate.Currency
  ): Promise<Either<InvalidRequestService, AxiosResponse<ExchangeRate.LatestCurrencyResponse>>> {
    try {
      return right(await this._request.getLatestCurrencyRate(currency));
    } catch (error) {
      return left(new InvalidRequestService());
    }
  }
}

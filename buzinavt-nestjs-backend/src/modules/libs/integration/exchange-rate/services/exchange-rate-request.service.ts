import { LoggerService } from '@lib/logger/services/logger.service';
import { HelperService } from '@system/libs/services/helper.service';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { ExchangeRateConfig } from '../config/exchange-rate.config';
import { ExchangeRate } from '../types/exchange-rate.type';

export class ExchangeRateRequestService {
  private readonly _instance: AxiosInstance;
  private readonly _logger = new LoggerService(ExchangeRateRequestService.name);

  constructor() {
    this._instance = axios.create({
      baseURL: ExchangeRateConfig.BASE_URL + `/v6/` + ExchangeRateConfig.API_KEY,
    });
  }

  public async getLatestCurrencyRate(currency: ExchangeRate.Currency) {
    const config: AxiosRequestConfig = {
      method: 'GET',
      url: `/latest/${currency}`,
    };

    return await this._request<ExchangeRate.LatestCurrencyResponse>(config);
  }

  private async _request<T>(
    config: AxiosRequestConfig,
    retryCount = ExchangeRateConfig.RETRY_REQUEST,
    delay = ExchangeRateConfig.RETRY_DELAY
  ): Promise<AxiosResponse<T>> {
    try {
      this._logger.debug(`Send request retryCount => ${retryCount} delay => ${delay}: ${JSON.stringify(config)}`);
      return await this._instance(config);
    } catch (error) {
      if (retryCount <= 0) {
        this._logger.error(`Request failed after retries: ${JSON.stringify(config)}`, error);
        throw error;
      }

      this._logger.debug(
        `Request failed, retrying ${retryCount} more times: ${JSON.stringify(config)}`,
        isAxiosError(error) ? `${error.code} ${error.message}` : error
      );

      await HelperService.sleep(delay);

      return await this._request(config, retryCount - 1, delay * 2);
    }
  }
}

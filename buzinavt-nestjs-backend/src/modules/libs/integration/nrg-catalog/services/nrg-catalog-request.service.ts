import { LoggerService } from '@lib/logger/services/logger.service';
import { HelperService } from '@system/libs/services/helper.service';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, isAxiosError } from 'axios';
import { stringify } from 'flatted';
import * as FormData from 'form-data';
import * as qs from 'qs';
import { NrgCatalogConfig } from '../config/nrg-catalog.config';
import { NrgCatalog } from '../types/nrg-catalog.type';

export class NrgCatalogRequestService {
  private readonly _instance: AxiosInstance;
  private readonly _baseURL: string = NrgCatalogConfig.BASE_URL;
  private readonly _logger = new LoggerService(NrgCatalogRequestService.name);

  constructor() {
    this._instance = axios.create({
      baseURL: this._baseURL,
      timeout: 1000 * 10,
    });
  }

  public async login(email: string, password: string) {
    return await this._request<NrgCatalog.LoginResponse>({
      method: 'POST',
      url: `/api/${NrgCatalogConfig.AUTH_COLLECTION_NAME}/login`,
      data: {
        email,
        password,
      },
    });
  }

  public async setNewExchangeRate(data: NrgCatalog.ExchangeRateRequestEntity, token: string) {
    return await this._request<NrgCatalog.BaseDocResponse>(
      {
        method: 'POST',
        url: `/api/exchange-rate`,
        data: HelperService.removeUndefined(data),
      },
      token
    );
  }

  public async getOneByExternalId(externalId: string, token: string) {
    const stringifiedQuery = qs.stringify(
      {
        where: {
          externalId: {
            equals: externalId,
          },
        },
        limit: 1,
      },
      { addQueryPrefix: true }
    );
    return await this._request<NrgCatalog.PaginationResponse<NrgCatalog.CarCatalogRequestEntity>>(
      {
        method: 'GET',
        url: `/api/catalog-car${stringifiedQuery}`,
      },
      token
    );
  }

  public async updateCarCatalog(externalId: string, data: Partial<NrgCatalog.CarCatalogRequestEntity>, token: string) {
    const stringifiedQuery = qs.stringify(
      {
        where: {
          externalId: {
            equals: externalId,
          },
        },
      },
      { addQueryPrefix: true }
    );
    return await this._request<NrgCatalog.BaseDocResponse>(
      {
        method: 'PATCH',
        url: `/api/catalog-car${stringifiedQuery}`,
        data: HelperService.removeUndefined(data),
      },
      token
    );
  }

  public async createCarToCatalog(data: NrgCatalog.CarCatalogRequestEntity, token: string) {
    return await this._request<NrgCatalog.BaseDocResponse>(
      {
        method: 'POST',
        url: `/api/catalog-car`,
        data: HelperService.removeUndefined(data),
      },
      token
    );
  }

  public async uploadCatalogMedia(file: NodeJS.ReadableStream, alt: string, token: string) {
    const formData = new FormData();

    formData.append('file', file);

    formData.append(
      '_payload',
      JSON.stringify({
        alt: alt,
      })
    );

    return await this._request<NrgCatalog.BaseDocResponse>(
      {
        method: 'POST',
        url: '/api/auction-media',
        data: formData,
        timeout: 1000 * 15,
      },
      token
    );
  }

  private async _request<T>(
    config: AxiosRequestConfig,
    token?: string,
    retryCount = NrgCatalogConfig.RETRY_REQUEST,
    delay = NrgCatalogConfig.RETRY_DELAY
  ): Promise<AxiosResponse<T>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { data: _, ...notData } = config;

    const dataToString = () => {
      if (config.data instanceof FormData) {
        return stringify(notData);
      }
      return stringify(config);
    };

    try {
      this._logger.debug(
        `Send request retryCount => ${retryCount} delay => ${delay} token => ${token}: ${dataToString()}`
      );
      return await this._instance.request({
        ...config,
        headers: {
          ...config.headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (error) {
      if (retryCount <= 0) {
        this._logger.error(`Request failed after retries, token => ${token}: ${dataToString()}`, error);
        throw error;
      }

      this._logger.debug(
        `Request failed, retrying ${retryCount} more times: ${dataToString()}`,
        isAxiosError(error) ? `${error.code} ${error.message}` : error
      );

      await HelperService.sleep(delay);

      return await this._request(config, token, retryCount - 1, delay * 2);
    }
  }
}

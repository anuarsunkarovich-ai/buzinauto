import { JapanAuctionRequestService } from '@lib/integration/japan-auction/services/japan-auction-request.service';
import { LoggerService } from '@lib/logger/services/logger.service';
import { InvalidLengthFileException } from '@lib/request/exceptions/invalid-length-file.exception';
import { InvalidRequestService } from '@lib/request/exceptions/invalid-request.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Either, left, right } from '@sweet-monads/either';
import { ConfigRepository } from '@system/libs/repositories/config.repository';
import { Cache } from 'cache-manager';
import { CarCatalogNotFoundException } from '../exceptions/car-catalog-not-found.exception';
import { InvalidLoginUserException } from '../exceptions/invalid-login-user.exception';
import { NrgCatalog } from '../types/nrg-catalog.type';
import { NrgCatalogRequestService } from './nrg-catalog-request.service';

export class NrgCatalogClientService {
  private readonly _logger = new LoggerService(NrgCatalogClientService.name);
  private _tokenPromise: Promise<Either<InvalidLoginUserException, string>> | null = null;
  private _tokenLock = false;
  private readonly _japanAuctionRequestService = new JapanAuctionRequestService();

  constructor(
    @Inject(NrgCatalogRequestService) private readonly _request: NrgCatalogRequestService,
    @Inject(CACHE_MANAGER) private _cache: Cache
  ) {}

  public async setNewExchangeRate(
    data: NrgCatalog.ExchangeRateRequestEntity
  ): Promise<Either<InvalidRequestService, NrgCatalog.BaseDocResponse>> {
    const ioToken = await this.getToken();
    if (ioToken.isLeft()) return left(ioToken.value);
    const token = ioToken.value;

    try {
      const result = await this._request.setNewExchangeRate(data, token);
      return right(result.data);
    } catch (error) {
      this._logger.error('Set new exchange rate', error);
      return left(new InvalidRequestService());
    }
  }

  public async getOneByExternalId(
    externalId: string
  ): Promise<Either<InvalidRequestService | CarCatalogNotFoundException, NrgCatalog.CarCatalogRequestEntity>> {
    const ioToken = await this.getToken();
    if (ioToken.isLeft()) return left(ioToken.value);
    const token = ioToken.value;

    try {
      const result = await this._request.getOneByExternalId(externalId, token);
      if (!result?.data?.docs?.length) {
        return left(new CarCatalogNotFoundException());
      }
      return right(result.data.docs?.[0]);
    } catch (error) {
      this._logger.error('Update car to catalog', error);
      return left(new InvalidRequestService());
    }
  }

  public async updateCarCatalog(
    externalId: string,
    data: Partial<NrgCatalog.CarCatalogRequestEntity>
  ): Promise<Either<InvalidRequestService, NrgCatalog.BaseDocResponse>> {
    const ioToken = await this.getToken();
    if (ioToken.isLeft()) return left(ioToken.value);
    const token = ioToken.value;

    try {
      const result = await this._request.updateCarCatalog(externalId, data, token);
      return right(result.data);
    } catch (error) {
      this._logger.error('Update car to catalog', error);
      return left(new InvalidRequestService());
    }
  }

  public async createCarToCatalog(
    data: NrgCatalog.CarCatalogRequestEntity
  ): Promise<Either<InvalidRequestService, NrgCatalog.BaseDocResponse>> {
    const ioToken = await this.getToken();
    if (ioToken.isLeft()) return left(ioToken.value);
    const token = ioToken.value;

    try {
      const result = await this._request.createCarToCatalog(data, token);
      return right(result.data);
    } catch (error) {
      this._logger.error('Add car to catalog', error);
      return left(new InvalidRequestService());
    }
  }

  public async uploadCatalogMediaByUrl(
    url: string,
    alt: string
  ): Promise<Either<InvalidRequestService | InvalidLengthFileException, NrgCatalog.BaseDocResponse>> {
    const ioToken = await this.getToken();
    if (ioToken.isLeft()) return left(ioToken.value);
    const token = ioToken.value;

    const ioStream = await this._japanAuctionRequestService.downloadFileByUrlSafe(url);
    if (ioStream.isLeft()) return left(ioStream.value);
    const fileStream = ioStream.value;

    try {
      const result = await this._request.uploadCatalogMedia(fileStream, alt, token);
      return right(result.data);
    } catch (error) {
      if (typeof fileStream.responseUrl === 'string' && url !== fileStream.responseUrl) {
        return await this.uploadCatalogMediaByUrl(fileStream?.responseUrl || url, alt);
      }
      return left(new InvalidRequestService());
    }
  }

  public async getToken(): Promise<Either<InvalidLoginUserException, string>> {
    const token = await this._cache.get<string>('token');
    if (token) return right(token);

    if (this._tokenLock) {
      // If another token request is in progress, wait for it
      while (this._tokenLock) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        const cachedToken = await this._cache.get<string>('token');
        if (cachedToken) return right(cachedToken);
      }
      // After lock is released, check cache again
      const cachedToken = await this._cache.get<string>('token');
      if (cachedToken) return right(cachedToken);
    }

    if (!this._tokenPromise) {
      this._tokenLock = true;
      this._tokenPromise = (async () => {
        try {
          const response = await this._request.login(
            ConfigRepository.get('NRG_CATALOG_LOGIN'),
            ConfigRepository.get('NRG_CATALOG_PASSWORD')
          );
          const [token, exp] = [response.data.token, response.data.exp];

          await this._cache.set('token', token, exp - Date.now() / 1000 - 300);
          return right(token);
        } catch (error) {
          this._logger.error('Fetching token', error);
          return left(new InvalidLoginUserException());
        } finally {
          this._tokenLock = false;
          this._tokenPromise = null;
        }
      })();
    }

    return this._tokenPromise;
  }
}

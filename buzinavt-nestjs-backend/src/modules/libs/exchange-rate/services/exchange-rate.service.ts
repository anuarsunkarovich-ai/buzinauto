import { ExchangeRateClientService } from '@lib/integration/exchange-rate/services/exchange-rate-client.service';
import { NrgCatalogClientService } from '@lib/integration/nrg-catalog/services/nrg-catalog-client.service';
import { Inject, OnModuleInit } from '@nestjs/common';
import { left } from '@sweet-monads/either';

export class ExchangeRateService implements OnModuleInit {
  constructor(
    @Inject(NrgCatalogClientService) private readonly _nrgCatalogClientService: NrgCatalogClientService,
    @Inject(ExchangeRateClientService) private readonly _exchangeRateClientService: ExchangeRateClientService
  ) {}

  async onModuleInit() {
    await this.writeNewRate();
  }

  public async writeNewRate() {
    const ioResult = await this._exchangeRateClientService.getLatestCurrencyRate('RUB');
    if (ioResult.isLeft()) return left(ioResult.value);
    const { data } = ioResult.value;

    await Promise.all([
      this._nrgCatalogClientService.setNewExchangeRate({
        fromCurrency: 'RUB',
        toCurrency: 'JPY',
        rate: data.conversion_rates.JPY,
      }),
      this._nrgCatalogClientService.setNewExchangeRate({
        fromCurrency: 'RUB',
        toCurrency: 'USD',
        rate: data.conversion_rates.USD,
      }),
      this._nrgCatalogClientService.setNewExchangeRate({
        fromCurrency: 'RUB',
        toCurrency: 'EUR',
        rate: data.conversion_rates.EUR,
      }),
      this._nrgCatalogClientService.setNewExchangeRate({
        fromCurrency: 'RUB',
        toCurrency: 'CNY',
        rate: data.conversion_rates.CNY,
      }),
    ]);
  }
}

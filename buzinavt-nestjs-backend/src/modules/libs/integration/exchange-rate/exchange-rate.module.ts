import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ExchangeRateClientService } from './services/exchange-rate-client.service';

const dependencies: Provider[] = [ExchangeRateClientService];

export const ExchangeRateModuleConfig = {
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(ExchangeRateModuleConfig)
export class ExchangeRateModule {}

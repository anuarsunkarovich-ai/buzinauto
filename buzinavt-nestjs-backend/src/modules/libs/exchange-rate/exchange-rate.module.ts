import { Module } from '@nestjs/common';
import { ExchangeRateServicesModule } from './modules/exchange-rate-services.module';

const dependencies = [ExchangeRateServicesModule];

@Module({
  imports: [...dependencies],
  exports: [...dependencies],
})
export class ExchangeRateModule {}

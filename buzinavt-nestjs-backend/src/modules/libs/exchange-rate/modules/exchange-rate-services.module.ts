import { IntegrationModule } from '@lib/integration/integration.module';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { ExchangeRateService } from '../services/exchange-rate.service';

const dependencies: Provider[] = [ExchangeRateService];

@Module({
  imports: [IntegrationModule],
  providers: [...dependencies],
  exports: [...dependencies],
})
export class ExchangeRateServicesModule {}

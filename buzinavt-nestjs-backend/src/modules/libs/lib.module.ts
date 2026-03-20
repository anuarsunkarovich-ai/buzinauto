import { Module } from '@nestjs/common';
import { CatalogCarsServicesModule } from './catalog-cars/modules/catalog-cars-services.module';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { IntegrationModule } from './integration/integration.module';
import { ParserModule } from './parser/parser.module';

const modules = [IntegrationModule, ParserModule, CatalogCarsServicesModule, ExchangeRateModule];

export const LibModuleConfig = {
  imports: [...modules],
  exports: [...modules],
};

@Module(LibModuleConfig)
export class LibModule {}

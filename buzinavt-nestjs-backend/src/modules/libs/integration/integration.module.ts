import { Module } from '@nestjs/common';
import { ExchangeRateModule } from './exchange-rate/exchange-rate.module';
import { JapanAuctionModule } from './japan-auction/japan-auction.module';
import { NrgCatalogModule } from './nrg-catalog/nrg-catalog.module';

const modules = [JapanAuctionModule, NrgCatalogModule, ExchangeRateModule];

export const IntegrationModuleConfig = {
  imports: [...modules],
  exports: [...modules],
};

@Module(IntegrationModuleConfig)
export class IntegrationModule {}

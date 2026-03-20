import { CatalogCarsServicesModule } from '@lib/catalog-cars/modules/catalog-cars-services.module';
import { JapanAuctionModule } from '@lib/integration/japan-auction/japan-auction.module';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { JapanAuctionParserService } from './services/japan-auction-parser.service';

const dependencies: Provider[] = [JapanAuctionParserService];

export const ParserJapanAuctionModuleConfig = {
  imports: [JapanAuctionModule, CatalogCarsServicesModule],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(ParserJapanAuctionModuleConfig)
export class ParserJapanAuctionModule {}

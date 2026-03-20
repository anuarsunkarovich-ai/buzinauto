import { CatalogCarsServicesModule } from '@lib/catalog-cars/modules/catalog-cars-services.module';
import { BrowserModule } from '@lib/parser/browser/browser.module';
import { ParserJapanAuctionModule } from '@lib/parser/japan-auction/parser-japan-auction.module';
import { JapanDetailsModule } from '@lib/parser/japan-details/japan-details.module';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { CrawlerListenerQueueService } from '../services/queue/crawler-listener.service';
import { CrawlerQueueServicesModule } from './crawler-queue-services.module';

const dependencies: Provider[] = [CrawlerListenerQueueService];

export const CrawlerServicesModuleConfig = {
  imports: [
    CrawlerQueueServicesModule,
    ParserJapanAuctionModule,
    BrowserModule,
    JapanDetailsModule,
    CatalogCarsServicesModule,
  ],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(CrawlerServicesModuleConfig)
export class CrawlerServicesModule {}

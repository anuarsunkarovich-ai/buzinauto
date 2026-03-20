import { NrgCatalogModule } from '@lib/integration/nrg-catalog/nrg-catalog.module';
import { CrawlerQueueServicesModule } from '@lib/parser/crawler/modules/crawler-queue-services.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { CarToCatalogService } from '../services/car-to-catalog.service';
import { CatalogCarEmitterServiceQueue, CatalogCarQueueAlias } from '../services/queue/catalog-car-emitter.queue';
import { CatalogCarListenerQueueService } from '../services/queue/catalog-car-listener.queue';

const dependencies: Provider[] = [CarToCatalogService, CatalogCarEmitterServiceQueue, CatalogCarListenerQueueService];

export const CatalogCarsServicesModuleConfig = {
  imports: [BullModule.registerQueue({ name: CatalogCarQueueAlias }), NrgCatalogModule, CrawlerQueueServicesModule],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(CatalogCarsServicesModuleConfig)
export class CatalogCarsServicesModule {}

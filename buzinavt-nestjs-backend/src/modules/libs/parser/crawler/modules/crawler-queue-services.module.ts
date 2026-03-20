import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { CrawlerEmitterServiceQueue, CrawlerQueueAlias } from '../services/queue/crawler-emitter.service';

const dependencies: Provider[] = [CrawlerEmitterServiceQueue];

export const CrawlerQueueServicesModuleConfig = {
  imports: [BullModule.registerQueue({ name: CrawlerQueueAlias })],
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(CrawlerQueueServicesModuleConfig)
export class CrawlerQueueServicesModule {}

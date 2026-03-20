import { CatalogCarConfig } from '@lib/catalog-cars/catalog-cars/catalog-cars.config';
import { CarUploadMediaFailedException } from '@lib/catalog-cars/exceptions/car-upload-media-failed.exception';
import { LoggerService } from '@lib/logger/services/logger.service';
import { CrawlerEmitterServiceQueue } from '@lib/parser/crawler/services/queue/crawler-emitter.service';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { CarToCatalogService } from '../car-to-catalog.service';
import { CatalogCarQueueAlias, CatalogCarQueuePayload } from './catalog-car-emitter.queue';

@Processor(CatalogCarQueueAlias, {
  concurrency: CatalogCarConfig.QUEUE_CONCURRENCY,
})
export class CatalogCarListenerQueueService extends WorkerHost {
  private readonly _logger = new LoggerService(CatalogCarListenerQueueService.name);

  constructor(
    @Inject(CarToCatalogService) private readonly _carToCatalogService: CarToCatalogService,
    @Inject(CrawlerEmitterServiceQueue) private readonly _crawlerEmitterServiceQueue: CrawlerEmitterServiceQueue
  ) {
    super();
  }

  async process(job: Job<CatalogCarQueuePayload>): Promise<any> {
    try {
      if (job.data.source === 'JAPAN_AUCTION_LIST') {
        const result = await this._carToCatalogService.create(job.data.data, job.data.inputData);
        if (result.value instanceof CarUploadMediaFailedException) {
          throw result.value;
        }
        if (result.isRight()) {
          await this._crawlerEmitterServiceQueue.emit({
            action: 'DETAILS',
            slug: `${job.data.data.prefix}-${job.data.data.id}`,
          });
        }
      } else if (job.data.source === 'JAPAN_AUCTION_DETAILS') {
        const result = await this._carToCatalogService.updateDetails(job.data.externalId, job.data.data);
        if (result.value instanceof CarUploadMediaFailedException) {
          throw result.value;
        }
      }
    } catch (e) {
      this._logger.error(e.message, e.stack);
      throw e;
    }
  }
}

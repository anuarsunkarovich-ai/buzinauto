import { JapanAuction } from '@lib/integration/japan-auction/types/japan-auction.type';
import { LoggerService } from '@lib/logger/services/logger.service';
import { InjectQueue } from '@nestjs/bullmq';
import { JobsOptions, Queue } from 'bullmq';
import { CrawlerConfig } from '../../config/crawler.config';

export const CrawlerQueueAlias = 'crawler';

export type CrawlerListPageQueuePayload = {
  action: 'LIST_PAGE';
  maxPage?: number;
  ignoreSanction?: boolean;
} & Omit<JapanAuction.FilterAuto, 'page'>;

export type CrawlerDetailsQueuePayload = {
  action: 'DETAILS';
  slug: string;
};

export type CrawlerQueuePayload = CrawlerListPageQueuePayload | CrawlerDetailsQueuePayload;

export class CrawlerEmitterServiceQueue {
  private readonly _logger = new LoggerService(CrawlerEmitterServiceQueue.name);

  constructor(@InjectQueue(CrawlerQueueAlias) private readonly _queue: Queue<CrawlerQueuePayload>) {
    // +(async () => {
    //   const failedJobs = await _queue.getFailed();
    //   for (const job of failedJobs) {
    //     await job.retry(); // Перезапускаем задачу
    //     console.log(`Job ${job.id} retried without failed`);
    //   }
    // })();
    // +(async () => {
    // await this.emit({
    //   action: 'LIST_PAGE',
    //   brand: JapanAuctionBrand.TOYOTA,
    //   isStat: false,
    //   model: 'ALLION',
    //   maxPage: 1,
    //   country: 'CHINA',
    // });
    // await this.emit({
    //   action: 'LIST_PAGE',
    //   brand: JapanAuctionBrand.TOYOTA,
    //   isStat: false,
    //   model: 'ALLION',
    //   maxPage: 1,
    //   country: 'JAPAN',
    // });
    // })();
    // +(async () => {
    //   await this.emit({
    //     action: 'DETAILS',
    //     slug: 'st-2uZCcwZGcneBret',
    //   });
    //   await this.emit({
    //     action: 'DETAILS',
    //     slug: 'che-7ABFKsCa4cSrEH',
    //   });
    // })();
  }

  async emit(data: CrawlerQueuePayload, opts: JobsOptions = {}) {
    this._logger.debug(`Emit new queue data => ${JSON.stringify(data)}`);
    return await this._queue.add('default', data, {
      attempts: CrawlerConfig.MAX_ATTEMPTS,
      backoff: {
        type: 'fixed',
        delay: CrawlerConfig.RETRY_DELAY,
      },
      deduplication: {
        id: this._uniqId(data),
      },
      ...opts,
    });
  }

  async emitBatch(data: CrawlerQueuePayload[], opts: JobsOptions = {}) {
    this._logger.debug(`Emit new queue data => ${JSON.stringify(data)}`);
    return await this._queue.addBulk(
      data.map((item) => {
        return {
          name: 'default',
          data: item,
          opts: {
            attempts: CrawlerConfig.MAX_ATTEMPTS,
            backoff: {
              type: 'fixed',
              delay: CrawlerConfig.RETRY_DELAY,
            },
            deduplication: {
              id: this._uniqId(item),
            },
            ...opts,
          },
        };
      })
    );
  }

  private _uniqId(data: CrawlerQueuePayload): string {
    if (data.action === 'LIST_PAGE') {
      return data.brand + ':' + data.model + ':' + data.country;
    } else if (data.action === 'DETAILS') {
      return data.slug;
    }
  }
}

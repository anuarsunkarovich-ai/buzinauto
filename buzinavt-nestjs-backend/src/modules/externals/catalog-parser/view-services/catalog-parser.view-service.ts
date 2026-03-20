import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import {
  JapanAuctionModelAll,
  JapanAuctionModelDictionary,
} from '@lib/integration/japan-auction/dictionaries/japan-auction-model.dictionary';
import {
  CrawlerEmitterServiceQueue,
  CrawlerListPageQueuePayload,
} from '@lib/parser/crawler/services/queue/crawler-emitter.service';

import { Inject } from '@nestjs/common';
import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class CatalogParserViewServiceV1 {
  constructor(
    @Inject(CrawlerEmitterServiceQueue) private readonly _crawlerEmitterServiceQueue: CrawlerEmitterServiceQueue
  ) {
    void this._sync();
    setInterval(async () => {
      await this._sync();
    }, 86_400_000); // 24h
  }

  private async _sync() {
    for (const brand of ConfigRepository.get('JAPAN_AUCTION_CAR_SYNC_BRAND', '').split(',')) {
      if (JapanAuctionBrand[brand as keyof typeof JapanAuctionBrand]) {
        await this.addManyByBrandParser(brand as keyof typeof JapanAuctionBrand, 'JAPAN', 1, true);
      }
    }
    for (const brand of ConfigRepository.get('CHINA_AUCTION_CAR_SYNC_BRAND', '').split(',')) {
      if (JapanAuctionBrand[brand as keyof typeof JapanAuctionBrand]) {
        await this.addManyByBrandParser(brand as keyof typeof JapanAuctionBrand, 'CHINA', 1, true);
      }
    }
  }

  public async addJobToParserCatalog(
    brand: keyof typeof JapanAuctionBrand,
    model: JapanAuctionModelAll,
    country: 'JAPAN' | 'CHINA',
    maxPage: number,
    ignoreSanction: boolean
  ) {
    await this._crawlerEmitterServiceQueue.emit({
      action: 'LIST_PAGE',
      brand: JapanAuctionBrand[brand],
      isStat: false,
      model,
      country: country,
      maxPage,
      ignoreSanction,
    });
    return true;
  }

  public async addManyByBrandParser(
    brand: keyof typeof JapanAuctionBrand,
    country: 'JAPAN' | 'CHINA',
    maxPage: number,
    ignoreSanction: boolean
  ) {
    const allModels = JapanAuctionModelDictionary[brand];
    const data = allModels.map((model): CrawlerListPageQueuePayload => {
      return {
        action: 'LIST_PAGE',
        brand: JapanAuctionBrand[brand],
        isStat: false,
        model,
        country: country,
        maxPage,
        ignoreSanction,
      };
    });

    await this._crawlerEmitterServiceQueue.emitBatch(data);
    return true;
  }
}

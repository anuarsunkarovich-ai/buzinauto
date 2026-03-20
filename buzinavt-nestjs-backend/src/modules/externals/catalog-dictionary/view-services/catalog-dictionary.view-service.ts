import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import type { JapanAuctionModelAll as JapanAuctionModelAllType } from '@lib/integration/japan-auction/dictionaries/japan-auction-model.dictionary';
import {
  JapanAuctionModelAll,
  JapanAuctionModelDictionary,
} from '@lib/integration/japan-auction/dictionaries/japan-auction-model.dictionary';
import { HelperService } from '@system/libs/services/helper.service';

export class CatalogDictionaryViewServiceV1 {
  public async getAllModelAndBrand(): Promise<
    Record<keyof typeof JapanAuctionBrand, readonly JapanAuctionModelAllType[]>
  > {
    return JapanAuctionModelDictionary;
  }

  public async getAllModel(): Promise<readonly JapanAuctionModelAllType[]> {
    return JapanAuctionModelAll;
  }

  public async getAllBrand(): Promise<(keyof typeof JapanAuctionBrand)[]> {
    return HelperService.getKeyOfStringEnum(JapanAuctionBrand);
  }

  public async getAllModelByBrand(brand: keyof typeof JapanAuctionBrand): Promise<JapanAuctionModelAllType[]> {
    const models = JapanAuctionModelDictionary?.[brand];
    return Array.isArray(models) ? models : [];
  }
}

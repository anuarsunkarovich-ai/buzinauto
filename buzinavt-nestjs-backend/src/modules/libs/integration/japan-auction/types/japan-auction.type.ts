import { JapanAuctionBrand } from '../dictionaries/japan-auction-brand.dictionary';
import { JapanAuctionModelAll } from '../dictionaries/japan-auction-model.dictionary';

export namespace JapanAuction {
  export interface BaseFilter {
    page: number;
  }

  export interface FilterAuto extends BaseFilter {
    country: 'JAPAN' | 'CHINA';
    isStat: boolean;
    brand: JapanAuctionBrand;
    model: JapanAuctionModelAll;

    fromDate?: Date;
    toDate?: Date;
    fromYear?: number;
    toYear?: number;
    fromEnginePower?: number;
    toEnginePower?: number;
  }

  export interface ReadableAuction {
    id: string;
    prefix: string;
    lotNumber: string;
    auctionName: string;
    date: string;
    time: string;
    year: number;
    body: string;
    modification: string;
    transmission: string;
    horsepower: number | null;
    enginePower: number;
    airConditioning: string;
    driveType: string;
    mileageKm: number | null;
    rating: string | null;
    startingPriceYen: number | null;
    finalPriceYen: number | null;
    averagePrice: number;
    averagePriceArray?: number[];
    isSold: boolean;
    soldStatus: string;
    color: string;
    isSanctions?: boolean;
    imageIds: string[];
    additionalData?: {
      extraFields?: Record<string, string>;
    };
  }

  export interface RawPaginationRepsonse {
    md: string;
    t_sql: string;
    rows: string;
    page: string;
    sort_ord: string;
    limit_step: string;
    is_stat: string;
    lhw: string;
    stDt1: string;
    stDt2: string;
    link: string;
    xCnt: string;
    is_user: string;
    curr: string;
    n_start: string;
    n_finish: string;
    l_arrow: string;
    l_dots: string;
    r_dots: string;
    r_arrow: string;
    hl: string;
  }
}

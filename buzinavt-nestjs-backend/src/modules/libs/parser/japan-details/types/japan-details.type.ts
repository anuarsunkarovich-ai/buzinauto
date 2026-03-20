export namespace JapanDetails {
  export type EngineType = 'gasoline' | 'diesel' | 'electric' | 'hybrid-gasoline' | 'hybrid-diesel';

  interface Currency {
    usd: number;
    rub: number;
  }

  interface Duty {
    usd: number;
    rub: number;
    rate: string;
    min_rate: string;
  }

  interface Individual {
    total: Currency;
    customs_clearance: number;
    duty: Duty;
    recycling_fee: number;
  }

  interface LegalEntity {
    total: Currency;
    customs_clearance: number;
    duty: Duty;
    excise: number;
    vat: number;
    recycling_fee: number;
  }

  export interface CustomsDuty {
    individual: Individual;
    legalEntity: LegalEntity;
  }

  export interface AuctionList {
    image: string;
  }

  export interface Details {
    auctionList: AuctionList;
    mileageKm: number;
    startPrice: number;
    finishPrice: number;
    horsepower: number;
    enginePower: number;
    soldStatus: string;
    images: string[];
    engineType: EngineType;
    rateUSD: Record<'cny' | 'eur' | 'rub', number>;
  }

  export interface Result extends Details {
    duty: {
      individual: number;
      legalEntity: number;
    };
    fee: {
      individual: number;
      legalEntity: number;
    };
  }
}

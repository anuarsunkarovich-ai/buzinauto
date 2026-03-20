export namespace NrgCatalog {
  export interface BaseResponse {
    message: string;
  }

  export interface BaseDocResponse<T = { id: string }> extends BaseResponse {
    doc: T;
  }

  export interface PaginationResponse<T> extends BaseResponse {
    docs: T[];
  }

  export interface LoginResponse extends BaseResponse {
    user: UserEntity;
    token: string;
    exp: number;
  }

  export interface UserEntity {
    id: string;
    email: string;
    _verified: boolean;
    createdAt: string;
    updatedAt: string;
  }

  export interface ExchangeRateRequestEntity {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
  }

  export interface CarCatalogRequestEntity {
    images?: string[] | null;
    auctionList?: string;
    externalId: string;
    lot: number;
    auction: string;
    brand: string;
    body?: string | null;
    model: string;
    modelDisplay: string;
    modelSlug: string;
    year: number;
    wheelPosition?: ('right' | 'left') | null;
    transmission?: string | null;
    enginePower?: number | null;
    horsepower?: number | null;
    driveType?: string | null;
    rating?: string | null;
    price: {
      currency?: string | null;
      start?: number | null;
      final?: number | null;
      avg?: number | null;
      avgList?: number[] | null;
      finalRub?: number | null;
      breakdown?: any | null;
    };
    customsDuty?: {
      individual?: number | null;
      legalEntity?: number | null;
    };
    disposalFee?: {
      individual?: number | null;
      legalEntity?: number | null;
    };
    saleCountry?: ('JAPAN' | 'CHINA') | null;
    engineType?: ('gasoline' | 'diesel' | 'electric' | 'hybrid-gasoline' | 'hybrid-diesel') | null;
    mileageKm?: number | null;
    date: string;
    color?: string | null;
    saleStatus?: string | null;
    isSold?: boolean | null;
    isSanctions?: boolean | null;
    isFinish?: boolean | null;
  }
}

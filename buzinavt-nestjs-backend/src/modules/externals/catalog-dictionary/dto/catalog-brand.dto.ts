import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import { ApiProperty } from '@nestjs/swagger';
import { HelperService } from '@system/libs/services/helper.service';
import { IsEnum } from 'class-validator';

export class CatalogBrandDto {
  @IsEnum(HelperService.getKeyOfStringEnum(JapanAuctionBrand))
  @ApiProperty({ enum: HelperService.getKeyOfStringEnum(JapanAuctionBrand) })
  brand: keyof typeof JapanAuctionBrand;
}

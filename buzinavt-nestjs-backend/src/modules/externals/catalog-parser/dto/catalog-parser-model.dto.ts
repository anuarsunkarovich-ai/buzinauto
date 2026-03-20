import { JapanAuctionBrand } from '@lib/integration/japan-auction/dictionaries/japan-auction-brand.dictionary';
import { JapanAuctionModelAll } from '@lib/integration/japan-auction/dictionaries/japan-auction-model.dictionary';
import { ApiProperty } from '@nestjs/swagger';
import { HelperService } from '@system/libs/services/helper.service';
import { IsBoolean, IsEnum, IsIn, IsPositive } from 'class-validator';

export class CatalogParserModelDto {
  @IsEnum(HelperService.getKeyOfStringEnum(JapanAuctionBrand))
  @ApiProperty({ enum: HelperService.getKeyOfStringEnum(JapanAuctionBrand) })
  brand: keyof typeof JapanAuctionBrand;

  @IsEnum(JapanAuctionModelAll)
  @ApiProperty({ enum: JapanAuctionModelAll })
  model: JapanAuctionModelAll;

  @IsIn(['JAPAN', 'CHINA'])
  @ApiProperty({ enum: ['JAPAN', 'CHINA'] })
  country: 'JAPAN' | 'CHINA';

  @IsPositive()
  @ApiProperty({ default: 1 })
  maxPage: number;

  @IsBoolean()
  @ApiProperty({ default: false })
  ignoreSanction: boolean;
}

export class CatalogParserBrandDto {
  @IsEnum(HelperService.getKeyOfStringEnum(JapanAuctionBrand))
  @ApiProperty({ enum: HelperService.getKeyOfStringEnum(JapanAuctionBrand) })
  brand: keyof typeof JapanAuctionBrand;

  @IsIn(['JAPAN', 'CHINA'])
  @ApiProperty({ enum: ['JAPAN', 'CHINA'] })
  country: 'JAPAN' | 'CHINA';

  @IsPositive()
  @ApiProperty({ default: 1 })
  maxPage: number;

  @IsBoolean()
  @ApiProperty({ default: false })
  ignoreSanction: boolean;
}

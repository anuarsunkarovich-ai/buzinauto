import { Body, Controller, HttpStatus, Inject, Post, Get, Query } from '@nestjs/common';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiGuards } from '@system/externals/decorators/guards/api.guards';
import { SuccessResponse } from '@system/externals/responses/success.response';

interface AuctionCar {
  lot: string;
  brand: string;
  model: string;
  year: string;
  price_jpy: string;
  engine_cc: string;
  mileage: string;
  auction_date: string;
  image_url: string;
  price_details: {
    buy_and_delivery_rub: number;
    customs_broker_rub: number;
    customs_duty_rub: number;
    svh_transport_rub: number;
    company_commission: number;
  };
  total_rub: number;
}

@ApiTags(`Japan Auction`)
@Controller('japan-auction')
@ApiGuards()
export class JapanAuctionControllerV1 {
  @Get('/brands')
  @ApiResponse({
    type: SuccessResponse,
    status: HttpStatus.OK,
  })
  public async getBrands(): Promise<any> {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auction/filters');
      const data = await res.json();
      return { ok: true, data: data.results };
    } catch (e) {
      console.error('Failed to fetch brands from Python parser:', e);
      return { ok: true, data: [] };
    }
  }

  @Get('/search')
  @ApiResponse({
    type: SuccessResponse,
    status: HttpStatus.OK,
  })
  public async searchAuctions(
    @Query('brand') brand: string,
    @Query('model') model: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ): Promise<any> {
    try {
      console.log('Proxying to Python parser:', { brand, model, page, limit });
      const res = await fetch(`http://localhost:8000/api/v1/search?brand=${brand}&model=${model}`);
      const data = await res.json();

      const cars: AuctionCar[] = (data.results || []).map((car: any) => ({
        lot: car.lot,
        brand: brand,
        model: model,
        year: car.year,
        price_jpy: car.price_jpy,
        engine_cc: car.engine_cc,
        mileage: car.mileage,
        auction_date: car.auction_date,
        image_url: car.image_url,
        price_details: car.price_details,
        total_rub: car.total_rub
      }));

      return { ok: true, data: cars };
    } catch (e) {
      console.error('Parser proxy error:', e);
      return { ok: true, data: [] };
    }
  }
}

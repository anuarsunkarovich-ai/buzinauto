import { Module } from '@nestjs/common';
import { JapanAuctionControllerV1 } from './controllers/japan-auction.controller';
import { JapanAuctionClientService } from '@lib/integration/japan-auction/services/japan-auction-client.service';
import { JapanAuctionModule } from '@lib/integration/japan-auction/japan-auction.module';

@Module({
  imports: [JapanAuctionModule],
  controllers: [JapanAuctionControllerV1],
  providers: [JapanAuctionClientService],
})
export class JapanAuctionExternalModule {}

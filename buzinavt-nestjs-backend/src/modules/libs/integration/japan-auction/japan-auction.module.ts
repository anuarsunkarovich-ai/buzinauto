import { Module } from '@nestjs/common';
import { Provider } from '@nestjs/common/interfaces/modules/provider.interface';
import { JapanAuctionClientService } from './services/japan-auction-client.service';

const dependencies: Provider[] = [JapanAuctionClientService];

export const JapanAuctionModuleConfig = {
  providers: [...dependencies],
  exports: [...dependencies],
};

@Module(JapanAuctionModuleConfig)
export class JapanAuctionModule {}

import { Module } from '@nestjs/common';
import { CrawlerModule } from './crawler/crawler.module';
import { ParserJapanAuctionModule } from './japan-auction/parser-japan-auction.module';
import { BrowserModule } from './browser/browser.module';

const modules = [BrowserModule, ParserJapanAuctionModule, CrawlerModule];

export const ParserModuleConfig = {
  imports: [...modules],
  exports: [...modules],
};

@Module(ParserModuleConfig)
export class ParserModule {}

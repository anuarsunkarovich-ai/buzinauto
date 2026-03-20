import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class JapanAuctionConfig {
  public static get RETRY_REQUEST() {
    return 5;
  }
  public static get RETRY_DELAY() {
    return 1000;
  }
  public static get DEFAULT_LIMIT() {
    return 100;
  }
  public static get BASE_URL() {
    return ConfigRepository.get('JAPAN_AUCTION_BASE_URL');
  }
  public static get PROXY_HOST() {
    return ConfigRepository.get('JAPAN_AUCTION_PROXY_HOST');
  }
  public static get PROXY_PORT() {
    return ConfigRepository.number('JAPAN_AUCTION_PROXY_PORT');
  }
  public static get PROXY_USERNAME() {
    return ConfigRepository.get('JAPAN_AUCTION_PROXY_USERNAME');
  }
  public static get PROXY_PASSWORD() {
    return ConfigRepository.get('JAPAN_AUCTION_PROXY_PASSWORD');
  }
}

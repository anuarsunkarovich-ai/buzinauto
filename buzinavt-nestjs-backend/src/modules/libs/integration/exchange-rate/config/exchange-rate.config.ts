import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class ExchangeRateConfig {
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
    return ConfigRepository.get('EXCHANGE_RATE_BASE_URL');
  }
  public static get API_KEY() {
    return ConfigRepository.get('EXCHANGE_RATE_API_KEY');
  }
}

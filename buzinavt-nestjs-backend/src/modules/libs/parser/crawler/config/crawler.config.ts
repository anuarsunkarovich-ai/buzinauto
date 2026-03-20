import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class CrawlerConfig {
  public static get MAX_ATTEMPTS() {
    return ConfigRepository.number('CRAWLER_MAX_ATTEMPTS', 10);
  }

  public static get RETRY_DELAY() {
    return ConfigRepository.number('CRAWLER_RETRY_DELAY', 1000);
  }

  public static get QUEUE_CONCURRENCY() {
    return ConfigRepository.number('CRAWLER_QUEUE_CONCURRENCY', 1);
  }
}

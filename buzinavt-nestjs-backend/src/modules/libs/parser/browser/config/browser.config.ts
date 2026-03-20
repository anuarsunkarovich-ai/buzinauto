import { CrawlerConfig } from '@lib/parser/crawler/config/crawler.config';
import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class BrowserConfig {
  public static get TIMEOUT_GET_AVAILABLE() {
    return ConfigRepository.number('BROWSER_TIMEOUT_GET_AVAILABLE_BROWSER', 30000);
  }

  public static get TIMEOUT_LOAD_PAGE() {
    return ConfigRepository.number('BROWSER_TIMEOUT_LOAD_PAGE', 10000);
  }

  public static get MAX_RESERVED() {
    return ConfigRepository.number('BROWSER_MAX_RESERVED', CrawlerConfig.QUEUE_CONCURRENCY);
  }
}

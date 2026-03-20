import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class CatalogCarConfig {
  public static get QUEUE_MAX_ATTEMPTS_JOBS() {
    return ConfigRepository.number('CATALOG_CAR_QUEUE_MAX_ATTEMPTS_JOBS', 3);
  }
  public static get QUEUE_RETRY_DELAY() {
    return ConfigRepository.number('CATALOG_CAR_QUEUE_RETRY_DELAY', 1000 * 60 * 5); // 5 minutes
  }
  public static get QUEUE_CONCURRENCY() {
    return ConfigRepository.number('CATALOG_CAR_QUEUE_CONCURRENCY', 1);
  }
}

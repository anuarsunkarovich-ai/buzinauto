import { ConfigRepository } from '@system/libs/repositories/config.repository';

export class NrgCatalogConfig {
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
    return ConfigRepository.get('NRG_CATALOG_BASE_URL');
  }
  public static get AUTH_COLLECTION_NAME() {
    return ConfigRepository.get('NRG_CATALOG_AUTH_COLLECTION_NAME', 'user-profile');
  }
}

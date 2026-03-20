import { System } from '@system/type';
import * as Joi from 'joi';

export const EnvValidateConfig = {
  // # Настройки сервиса
  PORT: Joi.number().required(),
  NODE_ENV: Joi.string().valid('development', 'production').required() as unknown as 'development' | 'production',
  GLOBAL_PREFIX: Joi.string().required(),

  // Настройка парсинга Японского аукциона
  JAPAN_AUCTION_BASE_URL: Joi.string().uri().required(),
  JAPAN_AUCTION_USER_LOGIN: Joi.string().required(),
  JAPAN_AUCTION_IMAGE_BASE_URL: Joi.string().uri().required(),
  JAPAN_AUCTION_QUEUE_MAX_ATTEMPTS_JOBS: Joi.number().optional(),
  JAPAN_AUCTION_QUEUE_RETRY_DELAY: Joi.number().optional(),
  JAPAN_AUCTION_QUEUE_CONCURRENCY: Joi.number().optional(),

  JAPAN_AUCTION_CAR_SYNC_BRAND: Joi.string().optional(),
  CHINA_AUCTION_CAR_SYNC_BRAND: Joi.string().optional(),

  // Настройка с админкой сайта
  NRG_CATALOG_BASE_URL: Joi.string().uri().required(),
  NRG_CATALOG_LOGIN: Joi.string().required(),
  NRG_CATALOG_PASSWORD: Joi.string().required(),
  NRG_CATALOG_AUTH_COLLECTION_NAME: Joi.string().optional(),
  JAPAN_AUCTION_PROXY_HOST: Joi.string().optional(),
  JAPAN_AUCTION_PROXY_PORT: Joi.number().optional(),
  JAPAN_AUCTION_PROXY_USERNAME: Joi.string().optional(),
  JAPAN_AUCTION_PROXY_PASSWORD: Joi.string().optional(),

  // Настройка API для получения курса обмена
  EXCHANGE_RATE_BASE_URL: Joi.string().uri().required(),
  EXCHANGE_RATE_API_KEY: Joi.string().required(),

  // Настройка обработки данных с парсинга
  CATALOG_CAR_QUEUE_MAX_ATTEMPTS_JOBS: Joi.number().optional(),
  CATALOG_CAR_QUEUE_RETRY_DELAY: Joi.number().optional(),
  CATALOG_CAR_QUEUE_CONCURRENCY: Joi.number().optional(),

  // Browser
  BROWSER_MAX_RESERVED: Joi.number().optional(),
  BROWSER_TIMEOUT_LOAD_PAGE: Joi.number().optional(),
  BROWSER_TIMEOUT_GET_AVAILABLE_BROWSER: Joi.number().optional(),

  // Crawler
  CRAWLER_MAX_ATTEMPTS: Joi.number().optional(),
  CRAWLER_TTL_DUPLICATION_MS: Joi.number().optional(),
  CRAWLER_RETRY_DELAY: Joi.number().optional(),
  CRAWLER_QUEUE_CONCURRENCY: Joi.number().optional(),

  // # REDIS QUEUE
  QUEUE_REDIS_HOST: Joi.string().required(),
  QUEUE_REDIS_PORT: Joi.number().required(),
  QUEUE_REDIS_USERNAME: Joi.string(),
  QUEUE_REDIS_PASSWORD: Joi.string(),
  QUEUE_REDIS_USE_TLS: Joi.string().valid('true', 'false').required() as any as System.BooleanString,
  QUEUE_PREFIX_DEFAULT: Joi.string().optional(),

  // # Database setting
  DATABASE_URI: Joi.string().uri().required(),

  // # Logger
  LOGGER_ENABLED_PINO: Joi.string().valid('true', 'false').required() as unknown as System.BooleanString,

  // # Настройки swagger
  SWAGGER_API_URL: Joi.string().required(),
  SWAGGER_ENABLED: Joi.string().valid('true', 'false').required() as unknown as System.BooleanString,

  // # Rate Limit для всего приложения
  RATE_LIMIT_ENABLED: Joi.string().valid('true', 'false').required() as unknown as System.BooleanString,
  RATE_LIMIT_APP_TTL: Joi.number().required(),
  RATE_LIMIT_APP_LIMIT: Joi.number().required(),
};

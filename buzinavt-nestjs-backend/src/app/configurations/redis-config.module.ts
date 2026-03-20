import { config } from 'dotenv';
import { RedisOptions } from 'ioredis';
config();

export const redisConfig: RedisOptions = {
  host: process.env.QUEUE_REDIS_HOST,
  port: +process.env.QUEUE_REDIS_PORT,
  username: process.env.QUEUE_REDIS_USERNAME,
  password: process.env.QUEUE_REDIS_PASSWORD,

  tls:
    process.env.QUEUE_REDIS_USE_TLS === 'true'
      ? {
          host: process.env.QUEUE_REDIS_HOST,
          port: +process.env.QUEUE_REDIS_PORT,
        }
      : undefined,
};

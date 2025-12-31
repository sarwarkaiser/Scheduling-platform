
import Redis, { RedisOptions } from 'ioredis';
import { env } from './env';

const getRedisOptions = (): RedisOptions => ({
    host: env.REDIS_HOST || 'localhost',
    port: env.REDIS_PORT || 6379,
    maxRetriesPerRequest: null, // Required by BullMQ
});

// Singleton Redis instance for general use if needed
const globalForRedis = global as unknown as { redis: Redis };

export const redis = globalForRedis.redis || new Redis(getRedisOptions());

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

export const connection = new Redis(getRedisOptions());

import Logger from "@golf-district/shared/src/logger";
import { Redis } from "@upstash/redis";
import type pino from "pino";
import { loggerService } from "../webhooks/logging.service";

/**
 * `CacheService` provides functionalities to interact with a Redis cache.
 * It provides methods to retrieve data from cache or, if not present,
 * fetch it using a provided fetch function and subsequently store it in the cache.
 * It also allows for cache invalidation of a specific key.
 *
 * @example
 * const cacheService = new CacheService(redisUrl, redisToken);
 * const data = await cacheService.withCache('myKey', fetchDataFn, 3600);
 *
 * @see {@link withCache} for fetching data with caching mechanism.
 * @see {@link invalidateCache} for invalidating a cache item by key.
 * @see {@link setCache} for setting a cache item by key.
 * @see {@link getCache} for getting a cache item by key.
 * @see {@link Redis} for the Redis client used by this service.
 * @see {@link Logger} for the logger used by this service.
 */

export class CacheService {
  protected redis: Redis;
  protected logger: pino.Logger;
  /**
   * Creates an instance of CacheService.
   *
   * @param redisUrl - The URL to the Redis server.
   * @param redisToken - The token used for authenticating with the Redis server.
   */
  constructor(redisUrl: string, redisToken: string, logger?: pino.Logger) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    this.logger = logger ? logger : Logger(CacheService.name);
  }

  /**
   * Tries to fetch data from the Redis cache using the provided key.
   * If data is not present in the cache, it fetches the data using the provided fetch function and stores it in the cache.
   *
   * Use generic T to denote the type of the returned data.
   *
   * @param key - The cache key to lookup or set in Redis.
   * @param fetchFn - The function to fetch data if not present in the cache.
   * @param ttl - Optional. The time-to-live (TTL) duration in seconds for the cached data. Default is 20 minutes (1200 seconds).
   *
   * @returns Returns a Promise that resolves with the data either from the cache or fetched using the fetch function, typed as T.
   */
  withCache = async <T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = 1200 // default 20 minutes
  ): Promise<T> => {
    // Try getting the value from cache
    const cachedData = await this.redis.get<any>(key);
    if (cachedData) {
      this.logger.info(`Cache hit for key: ${key}`);
      return cachedData;
    }

    const data = await fetchFn();
    // Store the result in Redis cache
    await this.redis.set(key, JSON.stringify(data), { ex: ttl });

    return data;
  };

  /**
   * Invalidates a specific item from the Redis cache using the provided key.
   *
   * @param {string} key The cache key to remove from Redis.
   *
   * @returns {Promise<void>} A promise that resolves when the cache item is invalidated.
   */
  invalidateCache = async (key: string): Promise<void> => {
    await this.redis.del(key);
  };

  /**
   * Sets a specific item in the Redis cache using the provided key.
   * @param {string} key The cache key to set in Redis.
   * @param {T} data The data to set in Redis.
   * @param {number} ttl Optional. The time-to-live (TTL) duration in seconds for the cached data. Default is 20 minutes (1200 seconds).
   * @returns {Promise<void>} A promise that resolves when the cache item is set.
   * @example
   * const cacheService = new CacheService(redisUrl, redisToken);
   * const data = await cacheService.setCache('myKey', fetchDataFn, 3600);
   */
  setCache = async <T>(
    key: string,
    data: T,
    ttl = 1200 // default 20 minutes
  ): Promise<void> => {
    // this.logger.info(`Setting cache for key: ${key}`);
    await this.redis.set(key, JSON.stringify(data), { ex: ttl });
  };

  /**
   * Increments the cache for the specified key or sets it to 1 if it doesn't exist.
   *
   * @param key - The key to increment or set in the cache.
   * @returns A Promise that resolves to the updated count in the cache.
   */
  incrementOrSetKey = async (key: string): Promise<number> => {
    // this.logger.info(`Incrementing cache for key: ${key}`);
    const keyExists = await this.redis.exists(key);
    let count;

    if (!keyExists) {
      await this.redis.set(key, 1);
      count = 1;
    } else {
      count = await this.redis.incr(key);
    }

    return count;
  };

  /**
   * Gets a specific item from the Redis cache using the provided key.
   * @param {string} key The cache key to get from Redis.
   * @returns {Promise<T | null>} A promise that resolves with the cached data or null if not found.
   * @example
   * const cacheService = new CacheService(redisUrl, redisToken);
   * const data = await cacheService.getCache('myKey');
   */
  getCache = async <T>(key: string): Promise<T | null> => {
    // this.logger.info(`Getting cache for key: ${key}`);
    const cachedData = await this.redis.get<any>(key).catch((err) => {
      this.logger.error(`Error getting cache for key: ${key}, ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/CacheService/getCache",
        userAgent: "",
        message: "ERROR_GETTING_CACHE",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          key,
        }),
      });
      return null;
    });
    if (cachedData) {
      // this.logger.info(`Cache hit for key: ${key}`);
      return cachedData;
    }
    // this.logger.info(`Cache miss for key: ${key}`);
    return null;
  };
}

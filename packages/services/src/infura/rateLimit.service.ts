import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Service class for handling rate-limiting operations.
 */
export class RateLimitService {
  protected redis: Redis;
  public rateLimit: Ratelimit;

  /**
   * Constructs the RateLimitService.
   * @param {string} redisUrl - The URL of the Redis server.
   * @param {string} redisToken - The token for authenticating with Redis.
   */
  constructor(redisUrl: string, redisToken: string) {
    this.redis = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    //allow for 100 requests per second @TODO change
    this.rateLimit = new Ratelimit({
      redis: this.redis,
      limiter: Ratelimit.slidingWindow(100, "1 s"),
      timeout: 1000,
      prefix: "@golf-district/ratelimit:",
      analytics: true,
    });
  }

  /**
   * Checks if the identified client can access the resource based on rate-limiting rules.
   *
   * @param {string} identifier - The identifier for the client.
   * @returns {Promise<boolean>} A promise resolving to `true` if the client can access, otherwise `false`.
   * @throws Will throw an error if there is an issue checking the rate limit.
   * @example
   * // Check if the client with identifier 'example-client' can access.
   * const canAccess = await canAccess('example-client');
   * console.log(canAccess);
   */
  canAccess = async (identifier: string) => {
    return await this.rateLimit.limit(identifier);
  };

  /**
   * Creates an identifier based on the client's IP address and the requested path.
   *
   * @param {string} ip - The client's IP address.
   * @param {string} path - The requested path.
   * @returns {string} The created identifier.
   * @example
   * // Create an identifier for a client with IP '192.168.0.1' and path '/api/resource'.
   * const identifier = createIdentifier('192.168.0.1', '/api/resource');
   * console.log(identifier);
   */
  createIdentifier = (ip: string, path: string): string => {
    return `@golf-district:${ip}-${path}`;
  };
}

import { LocationClient, SearchPlaceIndexForTextCommand } from "@aws-sdk/client-location";
import { Redis } from "@upstash/redis";
import { mockClient } from "aws-sdk-client-mock";
import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import { CacheService } from "../cache.service";

describe("cacheService", () => {
  let cacheSerivce: CacheService;
  // let redisClient;
  beforeEach(() => {
    cacheSerivce = new CacheService("redis-url.com", "redis-token");
  });

  afterEach(() => {});

  it("should set the cache", async () => {
    vitest.spyOn(cacheSerivce.redis, "set").mockReturnValue(Promise.resolve());
    const resp = await cacheSerivce.setCache("key", { data: "data" });
    expect(resp).toBeUndefined();
  });

  it("Should get the cache", async () => {
    vitest.spyOn(cacheSerivce.redis, "get").mockReturnValue(Promise.resolve());
    const resp = await cacheSerivce.getCache("key1");
    expect(resp).toBeNull();
  });
});

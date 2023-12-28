import { afterEach, beforeEach, describe, expect, it, vitest } from "vitest";
import { RateLimitService } from "../rateLimit.service";

describe("rateLimit", () => {
  let rateLimitService: RateLimitService;
  beforeEach(() => {
    rateLimitService = new RateLimitService("https://redis.com", "redis-token");
  });

  afterEach(() => {});
  it("Should create identifier", async () => {
    const response = await rateLimitService.createIdentifier("127.0.0.1:5000", "/some/random/path");
    expect(response).toBe("@golf-district:127.0.0.1:5000-/some/random/path");
  });

  it("Should check if can access", async () => {
    // const response = await rateLimitService.canAccess("@golf-district:127.0.0.1:5000-/some/random/path");
    // expect(response.success).toBe(true);
  });
});

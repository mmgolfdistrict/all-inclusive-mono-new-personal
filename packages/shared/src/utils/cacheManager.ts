import { createCache } from "cache-manager";

export const cacheManager = createCache({
    ttl: 600000,
    refreshThreshold: 3000,
  });

 

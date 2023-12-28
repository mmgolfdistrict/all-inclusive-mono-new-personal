import { beforeEach, describe, expect, it } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { mockFavorites } from "../../../mocks/favorites.mock";
import { mockTeeTimes } from "../../../mocks/teeTimes.mock";
import { WatchlistService } from "../watchlist.service";

let dbMock = {
  select: createDrizzleMock([mockFavorites, mockTeeTimes, [], []]),
  insert: createDrizzleMock([mockFavorites, mockFavorites]),
  delete: createDrizzleMock([mockFavorites, mockFavorites]),
};

describe("Watchlist Service", () => {
  let watchlistService: WatchlistService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    watchlistService = new WatchlistService(dbMock as any);
  });

  describe("getWatchlist", () => {
    it("Should get watchlist", async () => {
      await watchlistService.getWatchlist("user1", "course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("toggleTeeTimeInWatchlist", () => {
    it("Should toggle tee times in watchlist", async () => {
      await watchlistService.toggleTeeTimeInWatchlist("user1", "teeTime1");
      expect(dbMock.select).toHaveBeenCalled();
      expect(dbMock.delete).toHaveBeenCalled();
    });
    it("Should fail if tee time is not found", async () => {
      await expect(watchlistService.toggleTeeTimeInWatchlist("user1", "teeTime1")).rejects.toThrow(
        "Tee time with id teeTime1 not found"
      );
    });
  });
});

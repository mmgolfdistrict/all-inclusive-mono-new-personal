import { beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock, mockBookings, mockCourses, mockTeeTimes, mockUsers } from "../../../mocks";
import { ProviderService } from "../../tee-sheet-provider/providers.service";
import { WeatherService } from "../../weather/weather.service";
import { SearchService } from "../search.service";

let dbMock = {
  select: createDrizzleMock([mockUsers, mockTeeTimes, mockBookings, mockTeeTimes, mockCourses]),
};

describe("SearchService", () => {
  let searchService: SearchService;
  let weatherService: WeatherService;
  let providerService: ProviderService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    weatherService = new WeatherService(dbMock as any, "redis-url.com", "redis-token");
    providerService = new ProviderService(dbMock as any, "redis-url.com", "redis-token", {
      username: "username",
      password: "password",
    });
    searchService = new SearchService(dbMock as any, weatherService, providerService);
  });
  describe("searchUsers", () => {
    it("Should search through users via text query", async () => {
      await searchService.searchUsers("query");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });

  describe("searchTeeTimes", () => {
    it("Should search through tee times", async () => {
      vitest.spyOn(weatherService, "getForecast").mockReturnValue(Promise.resolve([]));
      await searchService.searchTeeTimes("course1", new Date(), 1, 2, 9, 1, true, true, 10, 100);
    });
  });

  describe("getTeeTimeById", () => {
    it("Should get tee times by id", async () => {
      await searchService.getTeeTimeById("teeTime1", "user1");
      expect(dbMock.select).toHaveBeenCalled();
    });
  });
});

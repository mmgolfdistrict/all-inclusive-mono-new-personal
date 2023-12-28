import { beforeEach, describe, expect, it, vitest } from "vitest";
import { createDrizzleMock } from "../../../mocks";
import { mockCourses } from "../../../mocks/courses.mock";
import { WeatherService } from "../weather.service";

let dbMock = {
  select: createDrizzleMock([mockCourses]),
  update: createDrizzleMock([mockCourses]),
  insert: createDrizzleMock([mockCourses]),
};

global.fetch = vitest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ rates: { CAD: 1.42 } }),
  })
);

describe("WeatherService", () => {
  let weatherService: WeatherService;

  beforeEach(async () => {
    process.env.NODE_ENV = "test";
    process.env.LOG_LEVEL = "debug";
    weatherService = new WeatherService(dbMock as any, "redis-url.com", "redis-token");
  });

  describe("Forecast", () => {
    it("Should grab weather forecast for course", async () => {
      await weatherService.getForecast("course1");
      expect(dbMock.select).toHaveBeenCalled();
    });
    it("Should grab the forecast endpoint", async () => {
      try {
        await weatherService.getForecastEndpoint("10.0", "10.0");
      } catch {}
      expect(fetch).toHaveBeenCalled();
    });
    it("Should grab forcast data", async () => {
      try {
        await weatherService.fetchForecastData("https://test.endpoint.com");
      } catch {}
      expect(fetch).toHaveBeenCalled();
    });
  });
});

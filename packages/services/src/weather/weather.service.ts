import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import Logger from "@golf-district/shared/src/logger";
import { CacheService } from "../infura/cache.service";
import { LoggerService, loggerService } from "../webhooks/logging.service";
import type { _ForecastData, _WeatherData } from "./types";

/**
 * `WeatherService` - A service for fetching and optionally caching weather data.
 *
 * The `WeatherService` class extends `CacheService` to leverage caching capabilities.
 * It provides methods to fetch weather forecasts from specified endpoints and to determine the forecast
 * endpoint for given geographic coordinates. The service allows consumers to interact with weather
 * data from national wether servicev while optionally utilizing caching to optimize data retrieval
 * and reduce external API calls.
 *
 * The service uses the `Logger` utility for logging info, warning, and error messages to
 * help diagnose issues and understand the service usage and flow.
 *
 * @extends {CacheService}
 *
 * @example
 * ```typescript
 * const weatherService = new WeatherService(redisUrl, redisToken);
 *
 * weatherService.getForecast('https://api.example.com/forecast', true)
 *   .then(data => console.log(data))
 *   .catch(err => console.error(err));
 *
 * weatherService.getForecastEndpoint('37.7749', '-122.4194')
 *   .then(endpoint => console.log(endpoint))
 *   .catch(err => console.error(err));
 * ```
 *
 * @see {@link CacheService}
 * @see {@link Logger}
 * @see {@link https://www.weather.gov/documentation/services-web-api}
 */

export class WeatherService extends CacheService {
  constructor(
    private readonly database: Db,
    redisUrl: string,
    redisToken: string,
    private readonly loggerService: LoggerService
  ) {
    super(redisUrl, redisToken, Logger(WeatherService.name));
    this.loggerService = loggerService;
  }
  /**
   * Fetches the forecast for course with optional caching.
   *
   * This function retrieves forecast data from a specified endpoint. When the optional `useCache` parameter is
   * true, the function will attempt to retrieve the forecast data from the cache using the provided endpoint as
   * the cache key. If the data is not found in the cache, it will fetch the data from the provided endpoint, store
   * the fetched data in the cache, and return the data.
   *
   *
   * @param courseId - The course Id to retrieve the forecast data from.
   * @returns A promise that resolves to an array of forecast periods. Each period is an object containing:
   *  - `name`: The name of the period.
   *  - `temperature`: The temperature during the period.
   * @throws Will throw an error if the forecast data fetching fails (e.g., due to network issues, invalid URL, etc.).
   *
   * @example
   * ```typescript
   * getForecast('0000-asdf-0000-asdf')
   *   .then(data => console.log(data))
   *   .catch(err => console.error(err));
   * ```
   */
  async getForecast(courseId: string) {
    const [endpoint] = await this.database
      .select({
        endpoint: courses.forecastApi,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: `/WeatherService/getForecast`,
          userAgent: "",
          message: "COURSE_FORECAST_NOT_FOUND",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        return [];
      });
    if (!endpoint) {
      this.logger.fatal(`No forecast for Course with ID ${courseId} not found`);
      return [];
    }
    const forecastEndpoint = endpoint.endpoint;
    if (!forecastEndpoint) {
      this.logger.fatal(`No forecast for Course with ID ${courseId} not found`);
      return [];
    }
    this.logger.info(`getForecast called with forecastEndpoint: ${forecastEndpoint}`);
    return await this.withCache(`forecast:${forecastEndpoint}`, async () => {
      this.logger.debug(`Cache miss ${forecastEndpoint}`);
      return await this.fetchForecastData(forecastEndpoint);
    });
  }

  /**
   * Fetches forecast data from the specified forecast endpoint.
   *
   * @private
   * @param {string} forecastEndpoint - The forecast endpoint URL.
   * @returns {Promise<any[]>} A promise that resolves to an array of forecast periods.
   * @throws {Error} Throws an error if the forecast data fetching fails.
   *
   * @example
   * const forecastData = await fetchForecastData('https://api.example.com/forecast');
   * console.log(forecastData);
   * ```
   */
  private async fetchForecastData(forecastEndpoint: string) {
    this.logger.info(`fetchForecastData called with forecastEndpoint: ${forecastEndpoint}`);
    const response = await fetch(forecastEndpoint);
    if (!response.ok) {
      this.logger.warn(`fetchForecastData failed to fetch forecast data: ${response.statusText}`);
      this.loggerService.errorLog({
        userId: "",
        url: `/getForecast`,
        userAgent: "",
        message: "Error in getting weather forcast",
        stackTrace: `Weather forcast service is down`,
        additionalDetailsJSON: "",
      });
      return [];
    }

    const data: _ForecastData = (await response.json()) as _ForecastData;

    if (data?.properties && data?.properties.periods) {
      return data.properties.periods.map((period) => ({
        name: period.name,
        startTime: period.startTime,
        endTime: period.endTime,
        temperature: period.temperature,
        shortForecast: period.shortForecast,
        iconCode: period?.icon.split("/")?.pop()?.split("?")?.[0]?.split(",")?.[0] ?? "",
      }));
    } else {
      return [];
    }
  }

  /**
   * Determines the forecast endpoint for the provided geographic coordinates.
   *
   * @param latitude - The latitude of the location.
   * @param longitude - The longitude of the location.
   * @returns A promise that resolves to the forecast endpoint URL for the provided coordinates.
   * @throws Error - Throws an error if the weather data fetching fails.
   */
  getForecastEndpoint = async (latitude: string, longitude: string): Promise<string> => {
    this.logger.info(`getForecastEndpoint called with latitude: ${latitude}, longitude: ${longitude}`);
    const weatherEndpoint = `https://api.weather.gov/points/${latitude},${longitude}`;
    const response = await fetch(weatherEndpoint);
    if (!response.ok) {
      this.logger.warn(`getForecastEndpoint failed to fetch weather data: ${response.statusText}`);
      throw new Error(`Failed to fetch weather data: ${response.statusText}`);
    }

    const data: _WeatherData = (await response.json()) as _WeatherData;
    return data.properties.forecast;
  };
}

import Logger from "@golf-district/shared/src/logger";
import { CacheService } from "../infura/cache.service";
import { loggerService } from "../webhooks/logging.service";
import type {
  AcceptQuoteParams,
  AcceptQuoteSuccessResponse,
  AccessTokenRequest,
  AccessTokenSuccessResponse,
  CreateQuoteParams,
  CreateQuoteSuccessResponse,
  ErrorResponse,
  GetGuaranteeParams,
  GetQuoteResponse,
  Guarantee,
  QuoteSuccessResponse,
  TokenErrorResponse,
} from "./types";

/**
 * Handles interactions with the SensibleWeather API.
 */
export class SensibleService extends CacheService {
  /**
   * Creates an instance of SensibleService.
   *
   * @param {string} SENSIBLE_CLIENT_ID - Sensible client ID.
   * @param {string} SENSIBLE_CLIENT_SECRET - Sensible client secret.
   * @param {string} SENSIBLE_AUDIENCE - Sensible audience.
   * @param {string} redisUrl - Redis URL.
   * @param {string} redisToken - Redis token.
   */
  constructor(
    private readonly SENSIBLE_CLIENT_ID: string,
    private readonly SENSIBLE_CLIENT_SECRET: string,
    private readonly SENSIBLE_AUDIENCE: string,
    redisUrl: string,
    redisToken: string
  ) {
    super(redisUrl, redisToken, Logger(SensibleService.name));
  }

  /**
   * Fetches and stores the SensibleWeather API access token in the Redis store.
   * The token is set to expire in Redis based on the `expires_in` value returned by the API.
   *
   * @returns Promise that resolves once the operation completes.
   *
   * @throws Will throw an error if the API call fails or if there are issues with the token retrieval.
   *
   */
  getToken = async (): Promise<void> => {
    const SENSIBLE_AUTH_URL: string = process.env.SENSIBLE_AUTH_URL!;

    this.logger.info("getAccessToken called");
    const payload: AccessTokenRequest = {
      grant_type: "client_credentials",
      client_id: this.SENSIBLE_CLIENT_ID,
      client_secret: this.SENSIBLE_CLIENT_SECRET,
      audience: this.SENSIBLE_AUDIENCE,
    };
    console.log(payload);
    const response = await fetch(SENSIBLE_AUTH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData: TokenErrorResponse = await response.json();
      this.logger.fatal(
        `Failed to retrieve access token from SensibleWeather API: ${errorData.error}: ${errorData.error_description}`
      );
      throw new Error(`${errorData.error}: ${errorData.error_description}`);
    }

    const data: AccessTokenSuccessResponse = await response.json();

    await this.invalidateCache("sensible_access_token");
    await this.setCache("sensible_access_token", data.access_token, data.expires_in);
  };

  /**
   * Fetches a quote from the SensibleWeather API.
   *
   * @param product_id - Identifier for the Product used to define behavior for Quotes and Guarantees.
   * @param coverageStartDate - The day on which coverage begins.
   * @param coverageEndDate - The day on which coverage ends.
   * @param currency - 3 character ISO code representing the currency of the quote.
   * @param langLocale - The end user's preferred language in BCP47 format.
   * @param exposureName - The human-readable/user-facing name of the location or experience being covered.
   * @param exposureLatitude - The latitude in decimal degrees of the exposure location.
   * @param exposureLongitude - The longitude in decimal degrees of the exposure location.
   * @param exposureTotalCoverageAmount - The total value of the exposure to be covered.
   *
   * @returns The fetched quote.
   */
  getQuote = async ({
    product_id,
    coverageStartDate,
    coverageEndDate,
    currency,
    langLocale,
    exposureName,
    exposureLatitude,
    exposureLongitude,
    exposureTotalCoverageAmount,
  }: {
    product_id: string;
    coverageStartDate: string;
    coverageEndDate: string;
    currency: string;
    langLocale: string;
    exposureName: string;
    exposureLatitude: number;
    exposureLongitude: number;
    exposureTotalCoverageAmount: number;
  }): Promise<QuoteSuccessResponse> => {
    // Validate dates
    this.logger.info(
      `getQuote called with product_id: ${product_id}, 
      coverageStartDate: ${coverageStartDate}, 
      coverageEndDate: ${coverageEndDate}, 
      currency: ${currency}, 
      langLocale: ${langLocale}, 
      exposureName: ${exposureName}, 
      exposureLatitude: ${exposureLatitude}, 
      exposureLongitude: ${exposureLongitude}, 
      exposureTotalCoverageAmount: ${exposureTotalCoverageAmount}`
    );
    const startDate = new Date(coverageStartDate);
    const endDate = new Date(coverageEndDate);
    if (startDate > endDate) {
      this.logger.warn(`Coverage start date should be before the end date.`);
      throw new Error("Coverage start date should be before the end date.");
    }

    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/getQuote",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            product_id,
            coverageStartDate,
            coverageEndDate,
            currency,
            langLocale,
            exposureName,
            exposureLatitude,
            exposureLongitude,
            exposureTotalCoverageAmount,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    const response = await fetch(`${this.getEndpoint()}/quote/guarantee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({
        product_id,
        coverage_start_date: coverageStartDate,
        coverage_end_date: coverageEndDate,
        currency,
        lang_locale: langLocale,
        exposure_name: exposureName,
        exposure_latitude: exposureLatitude,
        exposure_longitude: exposureLongitude,
        exposure_total_coverage_amount: exposureTotalCoverageAmount,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      this.logger.fatal(
        `Failed to retrieve quote from SensibleWeather API: ${errorData.code}: ${errorData.message}`
      );
      throw new Error(`${errorData.error}: ${errorData.message}`);
    }
    const data = (await response.json()) as QuoteSuccessResponse;

    return data;
  };

  /**
   * Fetches a specific quote from the SensibleWeather API by quote ID.
   *
   * @param {string} quoteId - Identifier of the quote to retrieve.
   * @returns {Promise<GetQuoteResponse>} - Promise that resolves with the details of the fetched quote.
   * @throws {Error} - Throws an error if the API call fails.
   * @example
   * const quoteDetails = await getQuoteById("xyz123");
   */
  getQuoteById = async (quoteId: string): Promise<GetQuoteResponse> => {
    let bearerToken: string | null = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/getQuoteById",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            quoteId,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }
    const url = `${this.getEndpoint()}/quote/guarantee/${quoteId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    });
    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      this.logger.fatal(
        `Failed to retrieve quote from SensibleWeather API: ${errorData.code}: ${errorData.message}`
      );
      throw new Error(`${errorData.code}: ${errorData.message}`);
    }
    return (await response.json()) as GetQuoteResponse;
  };

  /**
   * Fetches a guarantee from SensibleWeather based on provided parameters.
   *
   * @param params - Parameters to filter the Guarantee.
   * @returns Promise that resolves with an array of Guarantees.
   * @throws Will throw an error if the API call fails.
   */
  getGuarantee = async (params: GetGuaranteeParams): Promise<Guarantee[] | string> => {
    // this.logger.info(`getGuarantee called with params: ${JSON.stringify(params)}`);
    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/getGuarantee",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            params,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    const url = `${this.getEndpoint()}/guarantee`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      this.logger.warn(
        `Failed to retrieve guarantee from SensibleWeather API: ${errorData.code}: ${errorData.message}`
      );
      throw new Error(`${errorData.code}: ${errorData.message}`);
    }

    return (await response.json()) as Guarantee[];
  };

  /**
   * Cancels a specific guarantee in SensibleWeather using the given ID.
   *
   * @param params - Parameters containing the ID of the Guarantee to cancel.
   * @returns Promise that resolves when the operation is complete.
   * @throws Will throw an error if the API call fails or cancellation is unsuccessful.
   */
  cancelGuarantee = async (guaranteeId: string): Promise<void> => {
    this.(`cancelGuarantee called with guaranteeId: ${guaranteeId}`);
    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/cancelGuarantee",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            guaranteeId,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    const url = `${this.getEndpoint()}/guarantee/${guaranteeId}/cancel`;
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      this.logger.fatal(
        `Failed to cancel guarantee from SensibleWeather API: ${errorData.code}: ${errorData.message}`
      );
      throw new Error(`${errorData.code}: ${errorData.message}`);
    }
  };

  /**
   * Creates a quote using the SensibleWeather API.
   *
   * @param params - The parameters required to create a quote.
   *
   * @returns The response from the API.
   */
  createQuote = async (params: CreateQuoteParams): Promise<CreateQuoteSuccessResponse> => {
    // this.logger.info(`createQuote called with params: ${JSON.stringify(params)}`);
    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/createQuote",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            params,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    const response = await fetch(`${this.getEndpoint()}/quote/guarantee`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      this.logger.fatal(
        `Failed to create quote from SensibleWeather API: ${errorData.error}: ${errorData.error_description}`
      );
      throw new Error(`${errorData.error}: ${errorData.error_description}`);
    }

    return (await response.json()) as CreateQuoteSuccessResponse;
  };

  /**
   * Fetches a specific guarantee from SensibleWeather using the given ID.
   *
   * @param params - Parameters containing the ID of the Guarantee.
   * @returns Promise that resolves with the Guarantee details.
   * @throws Will throw an error if the API call fails.
   */
  getGuaranteeById = async (guaranteeId: string): Promise<Guarantee> => {
    // this.logger.info(`getGuaranteeById called with guaranteeId: ${guaranteeId}`);
    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/getGuaranteeById",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            guaranteeId,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    const url = `${this.getEndpoint()}/guarantee/${guaranteeId}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    });

    if (!response.ok) {
      const errorData: ErrorResponse = await response.json();
      this.logger.fatal(
        `Failed to retrieve guarantee from SensibleWeather API: ${errorData.code}: ${errorData.message}`
      );
      throw new Error(`${errorData.code}: ${errorData.message}`);
    }

    return (await response.json()) as Guarantee;
  };
  /**
   * Accepts a quote from the SensibleWeather API.
   *
   * @param params - The parameters required to accept a quote.
   *
   * @returns The response from the API.
   */
  acceptQuote = async (params: AcceptQuoteParams): Promise<AcceptQuoteSuccessResponse> => {
    // this.logger.info(`acceptQuote called with params: ${JSON.stringify(params)}`);
    let bearerToken: string | null = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/acceptQuote",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            params,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    // console.log("Before calling API https://jsonplaceholder.typicode.com/todos");

    // try {
    //   const response = await fetch("https://jsonplaceholder.typicode.com/todos");
    //   if (!response.ok) {
    //     this.logger.error(
    //       `Error calling API https://jsonplaceholder.typicode.com/todos: ${response.statusText}`
    //     );
    //     throw new Error(
    //       `Error calling API https://jsonplaceholder.typicode.com/todos: ${response.statusText}`
    //     );
    //   }
    //   const data = await response.json();
    //   this.logger.info(
    //     `Successfully called API https://jsonplaceholder.typicode.com/todos: ${JSON.stringify(data)}`
    //   );
    // } catch (err) {
    //   this.logger.error(`Error calling API https://jsonplaceholder.typicode.com/todos: ${err}`);
    // } finally {
    //   console.log("After calling API https://jsonplaceholder.typicode.com/todos - 1");
    // }
    // console.log("After calling API https://jsonplaceholder.typicode.com/todos - 2");

    // console.log(JSON.stringify(params));
    // console.log(
    //   JSON.stringify({
    //     price_charged: params.price_charged,
    //     reservation_id: params.reservation_id,
    //     lang_locale: params.lang_locale,
    //     user: { name: params.user.name, email: params.user.email, phone: params.user.phone },
    //   })
    // );

    const url = `${this.getEndpoint()}/quote/guarantee/${params.quoteId}/accept`;
    // console.log(`Sensible Bearer Token = ${bearerToken}`);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({
        guarantee_quote_id: params.quoteId,
        price_charged: params.price_charged,
        reservation_id: params.reservation_id,
        lang_locale: params.lang_locale,
        //@TODO add phone number from reservation screen if not provided in the profile. GOLFdistrict owns the phone number 877-Tee-Trade & 833-Tee-Trade
        user: {
          name: params.user.name,
          email: params.user.email,
          phone: params.user.phone || "+18778338723",
        },
      }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorData = responseData; //await response.json();

      this.logger.fatal(
        `Failed to accept quote from SensibleWeather API: ${errorData.message}: ${errorData.error_description}`
      );
      throw new Error(`${errorData.error}: ${errorData.error_description}`);
    }

    // return (await response.json()) as AcceptQuoteSuccessResponse;
    return responseData as AcceptQuoteSuccessResponse;
  };

  /**
   * Cancels a quote from the SensibleWeather API.
   * @TODO extra guards
   * @param quoteId - Identifier for the quote to be canceled.
   *
   * @returns The response from the API.
   */
  cancelQuote = async (quoteId: string): Promise<any> => {
    this.logger.info(`cancelQuote called with quoteId: ${quoteId}`);
    let bearerToken = await this.getCache("sensible_access_token");
    if (!bearerToken) {
      try {
        await this.getToken();
        // this.logger.info(`getQuote retrieved access token from SensibleWeather API.`);
        bearerToken = await this.getCache("sensible_access_token");
      } catch (err: any) {
        this.logger.error(`Error getting access token: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/SensibleService/cancelQuote",
          userAgent: "",
          message: "ERROR_GETTING_ACCESS_TOKEN",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            quoteId,
          }),
        });
        throw new Error(`Error getting access token: ${err}`);
      }
    }

    fetch(`${this.getEndpoint()}/quote/guarantee/${quoteId}/decline`, {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${bearerToken}`,
      },
    });
  };

  /**
   * Gets the SensibleWeather API endpoint based on the current environment.
   *
   * @returns {string} - The SensibleWeather API endpoint URL.
   * @example
   * const apiEndpoint = getEndpoint();
   */
  getEndpoint = (): string => {
    const SENSIBLE_BASE_URL = process.env.SENSIBLE_BASE_URL!;

    return SENSIBLE_BASE_URL;

    // switch (process.env.NODE_ENV) {
    //   case "production":
    //     return "https://protect.sensibleweather.io/api/v0_1";
    //   case "development":
    //   default:
    //     return "https://protect.sandbox.sensibleweather.io/api/v0_1";
    // }
  };
}

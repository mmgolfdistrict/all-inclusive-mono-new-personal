import type { Db } from "@golf-district/database";
import {
  AppSettingsService,
  AuctionService,
  AuthService,
  BookingService,
  CacheService,
  CashOutService,
  CheckoutService,
  CourseService,
  DomainService,
  EntityService,
  ForeUpWebhookService,
  GeoService,
  HyperSwitchService,
  HyperSwitchWebhookService,
  ImageService,
  NotificationService,
  SearchService,
  SensibleService,
  StripeService,
  TokenizeService,
  UploadService,
  UserService,
  WatchlistService,
  WeatherService,
} from "./index";
import { ProfanityService } from "./profanity/profanity.service";
import { ProviderService } from "./tee-sheet-provider/providers.service";
import { UserWaitlistService } from "./user-waitlist/userWaitlist.service";
import { FinixService } from "./webhooks/finix.service";
import { LoggerService } from "./webhooks/logging.service";
import { PaymentVerifierService } from "./webhooks/paymentverifier.service";

export interface ServiceConfig {
  database: Db;
  aws_accessKeyId: string;
  aws_secretAccessKey: string;
  aws_region: string;
  aws_bucket: string;
  aws_cloudFrontUrl: string;
  redisUrl: string;
  redisToken: string;
  twillio_accountSid: string;
  twillio_authToken: string;
  twillio_phoneNumber: string;
  sendGrid_email: string;
  sendGridApiKey: string;
  vercel_projectId: string;
  vercel_teamId: string;
  vercel_authBearerToken: string;
  hyperSwitchApiKey: string;
  hyperSwitchProfileId: string;
  foreUpApiKey: string;
  stripeApiKey: string;
  foreupUsername: string;
  foreupPassword: string;
  sensible_partner_id: string;
  sensible_product_id: string;
  sensible_client_Id: string;
  sensible_client_secret: string;
  sensible_audience: string;
  upStashClientToken: string;
}

/**
 * ServiceFactory - A factory class for creating instances of various services.
 *
 * This class provides methods to instantiate different services with the specified configuration.
 * It is responsible for creating instances of services such as HyperSwitchService, ForeUpWebhookService,
 * SearchService, BookingService, and many others.
 *
 * @example
 * ```typescript
 * const config: ServiceConfig = { ... };
 * const serviceFactory = new ServiceFactory(config);
 * const hyperSwitchService = serviceFactory.getHyperSwitchService();
 * ```
 */
export class ServiceFactory {
  constructor(protected readonly config: ServiceConfig) {}

  /**
   * Returns an instance of HyperSwitchService with the provided API key.
   * @returns An instance of HyperSwitchService.
   */
  getHyperSwitchService = (): HyperSwitchService => {
    return new HyperSwitchService(this.config.hyperSwitchApiKey);
  };

  /**
   * Returns an instance of ForeUpWebhookService with the provided database and provider service.
   * @returns An instance of ForeUpWebhookService.
   */
  getForeupWebhookService = (): ForeUpWebhookService => {
    return new ForeUpWebhookService(this.config.database, this.getProviderService());
  };

  /**
   * Returns an instance of SearchService with the provided database, weather service, and provider service.
   * @returns An instance of SearchService.
   */
  getSearchService = (): SearchService => {
    return new SearchService(this.config.database, this.getWeatherService(), this.getProviderService());
  };

  /**
   * Returns an instance of BookingService with the provided database and HyperSwitch API key.
   * @returns An instance of BookingService.
   */
  getBookingService = (): BookingService => {
    return new BookingService(
      this.config.database,
      this.getTokenizerService(),
      this.getProviderService(),
      this.getNotificationService(),
      this.getLoggerService(),
      this.getHyperSwitchService(),
      this.getSensibleService()
    );
  };

  /**
   * Returns an instance of WatchlistService with the provided database.
   * @returns An instance of WatchlistService.
   */
  getWatchlistService = (): WatchlistService => {
    return new WatchlistService(this.config.database);
  };

  /**
   * Returns an instance of AuctionService with the provided database and HyperSwitch service.
   * @returns An instance of AuctionService.
   */
  getAuctionService = (): AuctionService => {
    return new AuctionService(this.config.database, this.getHyperSwitchService());
  };

  /**
   * Returns an instance of SensibleService with the provided configuration options.
   * @returns An instance of SensibleService.
   */
  getSensibleService = (): SensibleService => {
    return new SensibleService(
      this.config.sensible_client_Id,
      this.config.sensible_client_secret,
      this.config.sensible_audience,
      this.config.redisUrl,
      this.config.redisToken
    );
  };

  /**
   * Returns an instance of CourseService with the provided database and Vercel configuration options.
   * @returns An instance of CourseService.
   */
  getCourseService = (): CourseService => {
    return new CourseService(
      this.config.database,
      this.config.vercel_projectId,
      this.config.vercel_teamId,
      this.config.vercel_authBearerToken
    );
  };

  /**
   * Returns an instance of CheckoutService with the provided database and configuration options.
   * @returns An instance of CheckoutService.
   */
  getCheckoutService = (): CheckoutService => {
    return new CheckoutService(
      this.config.database,
      {
        sensible_partner_id: this.config.sensible_partner_id,
        sensible_product_id: this.config.sensible_product_id,
        SENSIBLE_API_KEY: this.config.sensible_client_secret,
        redisUrl: this.config.redisUrl,
        redisToken: this.config.redisToken,
        hyperSwitchApiKey: this.config.hyperSwitchApiKey,
        foreUpApiKey: this.config.foreUpApiKey,
        profileId: this.config.hyperSwitchProfileId,
      },
      this.getForeupWebhookService(),
      this.getProviderService()
    );
  };

  /**
   * Returns an instance of ProviderService with the provided database, Redis configuration, and ForeUp credentials.
   * @returns An instance of ProviderService.
   */
  getProviderService = (): ProviderService => {
    return new ProviderService(this.config.database, this.config.redisUrl, this.config.redisToken, {
      username: this.config.foreupUsername,
      password: this.config.foreupPassword,
    });
  };

  /**
   * Returns an instance of EntityService with the provided database.
   * @returns An instance of EntityService.
   */
  getEntityService = (): EntityService => {
    return new EntityService(this.config.database);
  };

  /**
   * Returns an instance of CacheService with the provided Redis configuration.
   * @returns An instance of CacheService.
   */
  getCacheService = (): CacheService => {
    return new CacheService(this.config.redisUrl, this.config.redisToken);
  };

  /**
   * Returns an instance of ImageService with the provided database.
   * @returns An instance of ImageService.
   */
  getImageService = (): ImageService => {
    return new ImageService(this.config.database);
  };

  /**
   * Returns an instance of WeatherService with the provided database and Redis configuration.
   * @returns An instance of WeatherService.
   */
  getWeatherService = (): WeatherService => {
    return new WeatherService(this.config.database, this.config.redisUrl, this.config.redisToken);
  };

  /**
   * Returns an instance of DomainService with the provided Vercel configuration options.
   * @returns An instance of DomainService.
   */
  getDomainService = (): DomainService => {
    return new DomainService(
      this.config.vercel_projectId,
      this.config.vercel_teamId,
      this.config.vercel_authBearerToken
    );
  };

  /**
   * Returns an instance of GeoService with the provided AWS configuration options.
   * @returns An instance of GeoService.
   */
  getGeoService = (): GeoService => {
    return new GeoService(
      this.config.aws_accessKeyId,
      this.config.aws_secretAccessKey,
      this.config.aws_region
    );
  };

  /**
   * Returns an instance of UploadService with the provided database, AWS configuration options, and ImageService.
   * @returns An instance of UploadService.
   */
  getUploadService = (): UploadService => {
    return new UploadService(
      this.config.database,
      this.config.aws_accessKeyId,
      this.config.aws_secretAccessKey,
      this.config.aws_region,
      this.config.aws_bucket,
      this.config.aws_cloudFrontUrl,
      this.getImageService()
    );
  };

  /**
   * Returns an instance of NotificationService with the provided database and notification configuration options.
   * @returns An instance of NotificationService.
   */
  getNotificationService = (): NotificationService => {
    return new NotificationService(
      this.config.database,
      this.config.twillio_phoneNumber,
      this.config.sendGrid_email,
      this.config.twillio_accountSid,
      this.config.twillio_authToken,
      this.config.sendGridApiKey
    );
  };

  /**
   * Returns an instance of AuthService with the provided database.
   * @returns An instance of AuthService.
   */
  getAuthService = (): AuthService => {
    return new AuthService(
      this.config.database,
      this.getNotificationService(),
      this.config.redisUrl,
      this.config.redisToken
    );
  };

  /**
   * Returns an instance of TokenizeService with the provided database.
   * @returns An instance of TokenizeService.
   */
  getTokenizerService = (): TokenizeService => {
    return new TokenizeService(
      this.config.database,
      this.getNotificationService(),
      this.getLoggerService(),
      this.getSensibleService()
    );
  };

  /**
   * Returns an instance of UserService with the provided database and NotificationService.
   * @returns An instance of UserService.
   */
  getUserService = (): UserService => {
    return new UserService(this.config.database, this.getNotificationService());
  };

  /**
   * Returns an instance of HyperSwitchWebhookService with the provided TokenizeService.
   * @returns An instance of HyperSwitchWebhookService.
   */
  getHyperSwitchWebhookService = (): HyperSwitchWebhookService => {
    return new HyperSwitchWebhookService(
      this.config.database,
      this.getTokenizerService(),
      this.getProviderService(),
      this.getNotificationService(),
      this.getBookingService(),
      this.getSensibleService(),
      this.getLoggerService(),
      this.config.upStashClientToken,
      this.getHyperSwitchService()
    );
  };
  getStripeService = (): StripeService => {
    return new StripeService(this.config.stripeApiKey);
  };

  getCashOutService = (): CashOutService => {
    return new CashOutService(this.config.database, this.getStripeService(), this.getNotificationService());
  };

  getAppSettingService = (): AppSettingsService => {
    return new AppSettingsService(this.config.database, this.getCacheService());
  };

  getPaymentVerifierService = (): PaymentVerifierService => {
    return new PaymentVerifierService(
      this.config.database,
      this.getHyperSwitchWebhookService(),
      this.getSensibleService(),
      this.getProviderService()
    );
  };

  getFinixService = (): FinixService => {
    return new FinixService(this.config.database, this.getCashOutService(), this.getLoggerService());
  };
  getLoggerService = (): LoggerService => {
    return new LoggerService();
  };
  getProfanityService = (): ProfanityService => {
    return new ProfanityService(this.config.database);
  };

  getUserWaitlistService = (): UserWaitlistService => {
    return new UserWaitlistService(this.config.database, this.getNotificationService());
  };
}

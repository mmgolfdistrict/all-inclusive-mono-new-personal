import type { Db } from "@golf-district/database";
import { and, eq, gte } from "@golf-district/database";
import { lists } from "@golf-district/database/schema/lists";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { AuctionService } from "../auction/auction.service";
import { HyperSwitchService } from "../payment-processor/hyperswitch.service";
//import { StripeService } from "../payment-processor/stripe.service";
import { SensibleService } from "../sensible/sensible.service";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { ForeUpWebhookService } from "../webhooks/foreup.webhook.service";
import type { CartValidationError, CustomerCart } from "./types";
import { CartValidationErrors } from "./types";

/**
 * Configuration options for the CheckoutService.
 */
export interface CheckoutServiceConfig {
  sensible_partner_id: string;
  sensible_product_id: string;
  SENSIBLE_API_KEY: string;
  redisUrl: string;
  redisToken: string;
  hyperSwitchApiKey: string;
  foreUpApiKey: string;
}

/**
 * Service handling the checkout process, including cart validation and building checkout sessions.
 * @example
 * const checkoutService = new CheckoutService(database, checkoutServiceConfig);
 */
export class CheckoutService {
  private auctionService: AuctionService;
  private readonly logger = Logger(CheckoutService.name);
  private hyperSwitch: HyperSwitchService;
  //private stripeService: StripeService;

  /**
   * Constructs a new CheckoutService.
   * @param {Db} database - The database instance.
   * @param {CheckoutServiceConfig} config - Configuration options for the service.
   * @example
   * const checkoutService = new CheckoutService(database, checkoutServiceConfig);
   */
  constructor(
    private readonly database: Db,
    config: CheckoutServiceConfig,
    private readonly foreupIndexer: ForeUpWebhookService,
    private readonly providerService: ProviderService
  ) {
    this.hyperSwitch = new HyperSwitchService(config.hyperSwitchApiKey);
    this.auctionService = new AuctionService(database, this.hyperSwitch);
    //this.stripeService = new StripeService(config.stripeApiKey);
  }

  /**
   * Builds a checkout session for the provided user and cart.
   * @param {string} userId - The ID of the user initiating the checkout.
   * @param {CustomerCart} customerCart - The customer's cart containing items to be checked out.
   * @returns {Promise<{ clientSecret: string | null }>} A promise resolving to the client secret for the checkout session.
   * @throws {Error} Throws an error if there are issues creating the payment intent or validating the cart.
   * @example
   * const userId = "user123";
   * const customerCart = {
   *   customerId: "customer456",
   *   cart: [
   *     {
   *       id: "item1",
   *       price: 50,
   *       product_data: {
   *         metadata: {
   *           // Item metadata...
   *         },
   *       },
   *     },
   *     // Additional items...
   *   ],
   * };
   * const checkoutSession = await checkoutService.buildCheckoutSession(userId, customerCart);
   */
  buildCheckoutSession = async (
    userId: string,
    customerCart: CustomerCart
  ): Promise<{
    clientSecret: string | null;
  }> => {
    // const errors = await this.validateCartItems(customerCart);
    // if (errors.length > 0) {
    //   return {
    //     errors: errors,
    //   };
    // }
    const [user] = await this.database
      .select({
        name: users.name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) {
      this.logger.warn(`User not found: ${customerCart.customerId}`);
      throw new Error(`User not found: ${customerCart.customerId}`);
    }
    if (!user.email) {
      this.logger.warn(`User email not found: ${customerCart.customerId}`);
      throw new Error(`User email not found: ${customerCart.customerId}`);
    }
    if (!user.name) {
      this.logger.warn(`User name not found: ${customerCart.customerId}`);
      throw new Error(`User name not found: ${customerCart.customerId}`);
    }
    const errors = await this.validateCartItems(customerCart);
    console.log("errors ", JSON.stringify(errors));
    // if (errors.length > 0) {
    //   const message = errors.map((message) => message.errorType)
    //   throw new Error(errors);
    // }
    const total = customerCart.cart.reduce((acc, item) => {
      return acc + item.price;
    }, 0);
    // const tax = await this.stripeService.getTaxRate(customerCart.cart).catch((err) => {
    //   this.logger.error(`Error calculating tax: ${err}`);
    //   throw new Error(`Error calculating tax: ${err}`);
    // });
    //@TODO: metadata to include sensible
    const paymentIntent = await this.hyperSwitch
      .createPaymentIntent({
        // @ts-ignore
        customer_id: customerCart.customerId,
        // name: user.name,
        amount: total,
        currency: "USD",
        // @ts-ignore
        metadata: customerCart,
      })
      .catch((err) => {
        this.logger.error(` ${err}`);
        throw new Error(`Error creating payment intent: ${err}`);
      });
    return {
      clientSecret: paymentIntent.client_secret,
    };
  };

  /**
   * Validates the items in a customer's cart.
   * @param {CustomerCart} customerCart - The customer's cart to be validated.
   * @returns {Promise<CartValidationError[]>} A promise resolving to an array of cart validation errors, if any.
   * @example
   * const customerCart = {
   *   customerId: "customer456",
   *   cart: [
   *     {
   *       id: "item1",
   *       price: 50,
   *       product_data: {
   *         metadata: {
   *           // Item metadata...
   *         },
   *       },
   *     },
   *     // Additional items...
   *   ],
   * };
   * const validationErrors = await checkoutService.validateCartItems(customerCart);
   */
  validateCartItems = async (customerCart: CustomerCart): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];

    for (const item of customerCart.cart) {
      console.log(item.product_data.metadata);
      switch (item.product_data.metadata.type) {
        case "first_hand":
          const [teeTime] = await this.database
            .select({
              id: teeTimes.id,
              courseId: teeTimes.courseId,
              entityId: teeTimes.entityId,
              date: teeTimes.date,
              providerCourseId: providerCourseLink.providerCourseId,
              providerTeeSheetId: providerCourseLink.providerTeeSheetId,
              providerId: teeTimes.soldByProvider,
              internalId: providerCourseLink.internalId,
            })
            .from(teeTimes)
            .leftJoin(
              providerCourseLink,
              and(
                eq(providerCourseLink.courseId, teeTimes.courseId),
                eq(providerCourseLink.providerId, teeTimes.soldByProvider)
              )
            )
            .where(eq(teeTimes.id, item.product_data.metadata.tee_time_id))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error finding tee time id`);
            });
          if (!teeTime) {
            errors.push({
              errorType: CartValidationErrors.TEE_TIME_NOT_AVAILABLE,
              product_id: item.id,
            });
            throw new Error("Tee time not found.");
            break;
          }

          const { provider, token } = await this.providerService.getProviderAndKey(
            teeTime.internalId!,
            teeTime.courseId
          );

          const [formattedDate] = teeTime.date.split(" ");

          const { insert, upsert, remove } = await this.foreupIndexer
            .indexDay(
              formattedDate!,
              teeTime.providerCourseId!,
              teeTime.courseId,
              teeTime.providerTeeSheetId!,
              teeTime.providerId,
              provider,
              token,
              teeTime.entityId
            )
            .catch((err) => {
              throw new Error(`Error indexing day ${formattedDate} please return to course page`);
            });
          if (insert.length > 0 && upsert.length > 0 && remove.length > 0) {
            break;
          }
          await this.foreupIndexer.saveTeeTimes(insert, upsert, remove).catch((err) => {
            this.logger.error("error saving indexed teetimes");
            throw new Error("there was an error indexing this day please return to course page");
          });
          const stillAvailable = await this.database
            .select({ id: teeTimes.id })
            .from(teeTimes)
            .where(
              and(
                eq(teeTimes.id, item.product_data.metadata.tee_time_id),
                gte(teeTimes.availableFirstHandSpots, item.product_data.metadata.number_of_bookings)
              )
            )
            .execute()
            .catch((err) => {
              throw new Error("Error retrieving teetime");
            });
          if (stillAvailable.length == 0) {
            errors.push({
              errorType: CartValidationErrors.TEE_TIME_NOT_AVAILABLE,
              product_id: item.id,
            });
            throw new Error("Tee time not found.");
          }

          break;

        case "second_hand":
          const [listing] = await this.database
            .select({
              listing: lists.id,
              isDeleted: lists.isDeleted,
            })
            .from(lists)
            .where(eq(lists.id, item.product_data.metadata.second_hand_id))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              throw new Error(`Error finding listing id`);
            });
          if (!listing || listing.isDeleted) {
            errors.push({
              errorType: CartValidationErrors.TEE_TIME_NOT_AVAILABLE,
              product_id: item.id,
            });
          }
          // Implement
          break;

        case "sensible":
          // const quoteValid = await this.sensibleService.getQuoteById(
          //   item.product_data.metadata.sensible_quote_id
          // );
          // if (!quoteValid) {
          //   errors.push({
          //     errorType: CartValidationErrors.QUOTE_INVALID,
          //     product_id: item.id,
          //   });
          // }
          break;

        case "auction":
          const auctionData = await this.auctionService.getAuctionById(item.product_data.metadata.auction_id);
          if (auctionData.auction.endDate < currentUtcTimestamp()) {
            errors.push({
              errorType: CartValidationErrors.AUCTION_NOT_ACTIVE,
              product_id: item.id,
            });
          }
          if (auctionData.auction.buyNowPrice !== item.price) {
            errors.push({
              errorType: CartValidationErrors.AUCTION_BUY_NOW_PRICE_MISMATCH,
              product_id: item.id,
            });
          }
          break;

        case "charity":
          // Implement validations if necessary
          break;

        default:
          this.logger.error(`Unknown product type: ${item.product_data.metadata}`);
          errors.push({
            errorType: CartValidationErrors.UNKNOWN_PRODUCT_TYPE,
            product_id: item.id,
          });
      }
    }
    return errors;
  };
}

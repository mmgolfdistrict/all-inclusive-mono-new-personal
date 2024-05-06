import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, eq, gte, inArray, sql } from "@golf-district/database";
import { bookings } from "@golf-district/database/schema/bookings";
import { charities } from "@golf-district/database/schema/charities";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { coursePromoCodeLink } from "@golf-district/database/schema/coursePromoCodeLink";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { lists } from "@golf-district/database/schema/lists";
import { promoCodes } from "@golf-district/database/schema/promoCodes";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { userPromoCodeLink } from "@golf-district/database/schema/userPromoCodeLink";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { AuctionService } from "../auction/auction.service";
import { HyperSwitchService } from "../payment-processor/hyperswitch.service";
//import { StripeService } from "../payment-processor/stripe.service";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import type { ForeUpWebhookService } from "../webhooks/foreup.webhook.service";
import type {
  AuctionProduct,
  CartValidationError,
  CharityProduct,
  ConvenienceFeeProduct,
  CustomerCart,
  FirstHandProduct,
  MarkupProduct,
  Offer,
  ProductData,
  SecondHandProduct,
  SensibleProduct,
  TaxProduct,
} from "./types";
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
  profileId: string;
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
  private readonly profileId: string;
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
    this.profileId = config.profileId;
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
  buildCheckoutSession = async (userId: string, customerCartData: CustomerCart, cartId = "") => {
    const { paymentId } = customerCartData;
    let data = {};
    // const errors = await this.validateCartItems(customerCart);
    // if (errors.length > 0) {
    //   return {
    //     errors: errors,
    //   };
    // }
    if (paymentId) {
      data = this.updateCheckoutSession(userId, customerCartData, cartId);
    } else {
      data = this.createCheckoutSession(userId, customerCartData);
    }
    return data;
  };

  createCheckoutSession = async (userId: string, customerCartData: CustomerCart) => {
    const { paymentId, ...customerCart } = customerCartData;

    this.logger.debug(`${JSON.stringify(customerCart)}`);
    const [user] = await this.database
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
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
    const errors = await this.validateCartItems(customerCartData);
    console.log("errors ", JSON.stringify(errors));

    // if (errors.length > 0) {
    //   const message = errors.map((message) => message.errorType)
    //   throw new Error(errors);
    // }
    const total = customerCart.cart
      .filter(({ product_data }) => product_data.metadata.type !== "markup")
      .reduce((acc, item) => {
        return acc + item.price;
      }, 0);
    // const tax = await this.stripeService.getTaxRate(customerCart.cart).catch((err) => {
    //   this.logger.error(`Error calculating tax: ${err}`);
    //   throw new Error(`Error calculating tax: ${err}`);
    // });
    //@TODO: metadata to include sensible
    //@TODO: update total form discount
    // debugger;
    console.log("===>", total);
    console.log("===>", parseInt(total.toString()));
    const paymentIntent = await this.hyperSwitch
      .createPaymentIntent({
        // @ts-ignore
        customer_id: customerCart.customerId,
        name: user.name,
        email: user.email,
        phone: user.phoneNumber,
        amount: parseInt(total.toString()),
        currency: "USD",
        profile_id: this.profileId,
        // @ts-ignore
        metadata: customerCart.courseId,
      })
      .catch((err) => {
        this.logger.error(` ${err}`);
        throw new Error(`Error creating payment intent: ${err}`);
      });

    let teeTimeId;
    let listingId;

    customerCartData?.cart?.forEach(({ product_data }: ProductData) => {
      if (product_data.metadata.type === "first_hand") {
        teeTimeId = product_data.metadata.tee_time_id;
      }
      if (product_data.metadata.type === "second_hand") {
        listingId = product_data.metadata.second_hand_id;
      }
    });

    //save customerCart to database
    const cartId: string = randomUUID();
    await this.database.insert(customerCarts).values({
      id: cartId,
      userId: userId,
      // courseId: customerCart.courseId,
      paymentId: paymentIntent.payment_id,
      cart: customerCart,
      listingId,
      teeTimeId,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.payment_id,
      cartId: cartId,
    };
  };

  updateCheckoutSession = async (userId: string, customerCartData: CustomerCart, cartId: string) => {
    const { paymentId, ...customerCart } = customerCartData;

    const total = customerCart.cart
      .filter(({ product_data }) => product_data.metadata.type !== "markup")
      .reduce((acc, item) => {
        return acc + item.price;
      }, 0);

    console.log(`paymentId = ${paymentId}`);
    console.log(`total = ${total}`);
    console.log(`userId = ${userId}`);
    console.log(`cartId = ${cartId}`);
    console.log(customerCartData);

    const paymentIntent = await this.hyperSwitch
      .updatePaymentIntent(paymentId || "", {
        currency: "USD",
        amount: parseInt(total.toString()),
        // @ts-ignore
      })
      .catch((err) => {
        this.logger.error(` ${err}`);
        throw new Error(`Error updating payment intent: ${err}`);
      });

    let teeTimeId;
    let listingId;

    customerCartData?.cart?.forEach(({ product_data }: ProductData) => {
      if (product_data.metadata.type === "first_hand") {
        teeTimeId = product_data.metadata.tee_time_id;
      }
      if (product_data.metadata.type === "second_hand") {
        listingId = product_data.metadata.second_hand_id;
      }
    });

    await this.database
      .update(customerCarts)
      .set({
        cart: customerCart,
        listingId,
        teeTimeId,
      })
      .where(and(eq(customerCarts.paymentId, paymentId || ""), eq(customerCarts.userId, userId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating customer cart: ${err}`);
        throw new Error("Error updating customer cart");
      });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.payment_id,
      cartId,
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
    const courseId = customerCart.courseId;

    for (const item of customerCart.cart) {
      switch (item.product_data.metadata.type) {
        case "first_hand":
          errors.push(...(await this.validateFirstHandItem(item as FirstHandProduct)));
          break;
        case "second_hand":
          errors.push(...(await this.validateSecondHandItem(item as SecondHandProduct)));
          break;
        case "sensible":
          errors.push(...(await this.validateSensibleItem(item as SensibleProduct)));
          break;
        case "markup":
          errors.push(...(await this.validateMarkupItem(item as MarkupProduct)));
          break;
        case "taxes":
          errors.push(...(await this.validateTaxesItem(item as TaxProduct)));
          break;
        case "convenience_fee":
          errors.push(...(await this.validateConvenienceFeeItem(item as ConvenienceFeeProduct)));
          break;
        case "auction":
          errors.push(...(await this.validateAuctionItem(item as AuctionProduct)));
          break;
        case "offer":
          errors.push(...(await this.validateOfferItem(item as Offer)));
          break;
        case "charity":
          errors.push(...(await this.validateCharityItem(item as CharityProduct, courseId)));
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

  validateFirstHandItem = async (item: FirstHandProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    const [teeTime] = await this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        // entityId: teeTimes.entityId,
        entityId: courses.entityId,
        date: teeTimes.date,
        providerCourseId: providerCourseLink.providerCourseId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        providerId: providerCourseLink.providerId,
        internalId: providers.internalId,
        time: teeTimes.time,
      })
      .from(teeTimes)
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      //.leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
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
    }

    const { provider, token } = await this.providerService.getProviderAndKey(
      teeTime.internalId!,
      teeTime.courseId
    );

    const [formattedDate] = teeTime.date.split(" ");

    if (teeTime.providerCourseId && teeTime.providerTeeSheetId && formattedDate) {
      await this.foreupIndexer.indexTeeTime(
        formattedDate,
        teeTime.providerCourseId,
        teeTime.providerTeeSheetId,
        provider,
        token,
        teeTime.time
      );
    }
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
      throw new Error("Expected Tee time spots may not be available anymore");
    }
    return errors;
  };

  validateSecondHandItem = async (item: SecondHandProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
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
    return errors;
  };

  validateSensibleItem = async (item: SensibleProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateMarkupItem = async (item: MarkupProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateTaxesItem = async (item: TaxProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateConvenienceFeeItem = async (item: ConvenienceFeeProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateAuctionItem = async (item: AuctionProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
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
    return errors;
  };

  validateCharityItem = async (item: CharityProduct, courseId: string): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    const [data] = await this.database
      .select({
        id: charities.id,
      })
      .from(charityCourseLink)
      .leftJoin(
        charities,
        and(eq(charityCourseLink.charityId, charities.id), eq(charityCourseLink.courseId, courseId))
      )
      .where(eq(charityCourseLink.courseId, courseId))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(`Error validatin charity item: ${err}`);
        throw new Error("Error validatin charity item");
      });
    if (!data) {
      errors.push({
        errorType: CartValidationErrors.CHARITY_NOT_ACTIVE,
        product_id: item.id,
      });
    }
    return errors;
  };

  validatePromoCode = async (
    userId: string,
    promoCode: string,
    courseId: string
  ): Promise<{
    discount: number;
    type: "PERCENTAGE" | "AMOUNT";
  }> => {
    const [data] = await this.database
      .select({
        promoCodeDetails: promoCodes,
        courseId: coursePromoCodeLink.courseId,
        totalNumberOfUserRedemptions: sql<number>`(
          SELECT COUNT(*)
          FROM ${userPromoCodeLink}
          WHERE ${userPromoCodeLink.promoCodeId} = ${promoCodes.id}
        )`,
        numberOfUserRedemption: sql<number>`(
          SELECT COUNT(*)
          FROM ${userPromoCodeLink}
          WHERE ${userPromoCodeLink.promoCodeId} = ${promoCodes.id}
          AND ${userPromoCodeLink.userId} = ${userId}
        )`,
      })
      .from(promoCodes)
      .where(eq(promoCodes.code, promoCode))
      .leftJoin(coursePromoCodeLink, eq(coursePromoCodeLink.promoCodeId, promoCodes.id))
      .execute();

    if (!data) {
      // Not found
      return {
        discount: 0,
        type: "PERCENTAGE",
      };
    }

    const promotion = data.promoCodeDetails;

    // Check if promo code is deleted, expired, not started, or max redemptions reached
    if (
      promotion.isDeleted ||
      promotion.expiresAt < currentUtcTimestamp() ||
      promotion.startsAt > currentUtcTimestamp() ||
      promotion.maxRedemptionsGlobal <= data.totalNumberOfUserRedemptions ||
      promotion.maxRedemptionsPerUser <= data.numberOfUserRedemption
    ) {
      return {
        discount: 0,
        type: "PERCENTAGE",
      };
    }

    // Check if promo code is global or specific to a course
    if (promotion.isGlobal || data.courseId === courseId) {
      return {
        discount: promotion.discount,
        type: promotion.discountType,
      };
    }

    // If none of the conditions are met, no discount is applied
    return {
      discount: 0,
      type: "PERCENTAGE",
    };
  };

  validateOfferItem = async (item: Offer): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    const bookingIds = item.product_data.metadata.booking_ids;
    const price = item.product_data.metadata.price;
    if (!bookingIds.length) {
      this.logger.warn(`No bookings specified.`);
      throw new Error("No bookings specified.");
    }
    const data = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
        minimumOfferPrice: bookings.minimumOfferPrice,
      })
      .from(bookings)
      .where(inArray(bookings.id, bookingIds))
      .leftJoin(lists, eq(lists.id, bookings.listId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        throw new Error("Error retrieving bookings");
      });
    if (!data.length || data.length !== bookingIds.length || !data[0]) {
      this.logger.warn(`No bookings found.`);
      throw new Error("No bookings found");
    }
    const firstTeeTime = data[0].teeTimeId;
    if (!data.every((booking) => booking.teeTimeId === firstTeeTime)) {
      throw new Error("All bookings must be under the same tee time.");
    }
    //price must to higher than the largest minimum offer price

    const minimumOfferPrice = Math.max(...data.map((booking) => booking.minimumOfferPrice));
    if (price < minimumOfferPrice) {
      throw new Error("Offer price must be higher than the minimum offer price.");
    }
    return errors;
  };
}

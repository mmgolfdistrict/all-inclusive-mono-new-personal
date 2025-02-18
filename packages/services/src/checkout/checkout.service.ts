import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, between, db, desc, eq, gt, gte, inArray, isNotNull, sql } from "@golf-district/database";
import { bookings } from "@golf-district/database/schema/bookings";
import { charities } from "@golf-district/database/schema/charities";
import { charityCourseLink } from "@golf-district/database/schema/charityCourseLink";
import { courseMembership } from "@golf-district/database/schema/courseMembership";
import { coursePromoCodeLink } from "@golf-district/database/schema/coursePromoCodeLink";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { lists } from "@golf-district/database/schema/lists";
import { promoCodes } from "@golf-district/database/schema/promoCodes";
import { providerCourseMembership } from "@golf-district/database/schema/providerCourseMembership";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { InsertTeeTimes, teeTimes } from "@golf-district/database/schema/teeTimes";
import { userPromoCodeLink } from "@golf-district/database/schema/userPromoCodeLink";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import UTC from "dayjs/plugin/utc";
import { AppSettingsService } from "../app-settings/app-settings.service";
import { AuctionService } from "../auction/auction.service";
import type { IpInfoService } from "../ipinfo/ipinfo.service";
import { HyperSwitchService } from "../payment-processor/hyperswitch.service";
//import { StripeService } from "../payment-processor/stripe.service";
import type { ProviderService } from "../tee-sheet-provider/providers.service";
import { clubprophetWebhookService } from "../webhooks/clubprophet.webhook.service";
import type { ForeUpWebhookService } from "../webhooks/foreup.webhook.service";
import { loggerService } from "../webhooks/logging.service";
import type {
  AuctionProduct,
  CartFeeTaxPercentProduct,
  CartValidationError,
  CharityProduct,
  ConvenienceFeeProduct,
  CustomerCart,
  FirstHandProduct,
  GreenFeeTaxPercentProduct,
  MarkupProduct,
  MarkupTaxPercentProduct,
  Offer,
  ProductData,
  SecondHandProduct,
  SensibleProduct,
  TaxProduct,
  WeatherGuaranteeTaxPercentProduct,
} from "./types";
import { CartValidationErrors } from "./types";
import { courseSetting } from "@golf-district/database/schema/courseSetting";

/**
 * Configuration options for the CheckoutService.
 */

type MaxReservationsAndMaxRoundsResult = {
  success: boolean;
  message: string;
};
dayjs.extend(UTC);
dayjs.extend(isSameOrBefore);
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
interface Address {
  city?: string;
  country?: string;
  line1?: string;
  line2?: string;
  line3?: string;
  zip?: string;
  state?: string;
  first_name?: string;
  last_name?: string;
}

interface CreateCustomer {
  customer_id: string;
  name?: string;
  email?: string;
  phone?: string;
  description?: string;
  address: Address;
}
/**
     * clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.payment_id,
      cartId,
      next_action: paymentIntent.next_action,
     */
interface CheckoutTypes {
  clientSecret: string;
  paymentId: string;
  cartId: string;
  next_action: string;
  error?: string;
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
  private clubProphetWebhook: clubprophetWebhookService;
  private appSettings: AppSettingsService;
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
    private readonly providerService: ProviderService,
    private readonly ipInfoService: IpInfoService
  ) {
    this.hyperSwitch = new HyperSwitchService(config.hyperSwitchApiKey);
    this.auctionService = new AuctionService(database, this.hyperSwitch);
    this.profileId = config.profileId;
    this.clubProphetWebhook = new clubprophetWebhookService(database, providerService);
    this.appSettings = new AppSettingsService(
      this.database,
      process.env.REDIS_URL!,
      process.env.REDIS_TOKEN!
    );
    //this.stripeService = new StripeService(config.stripeApiKey);
    //this.appSettings=new AppSettingsService()
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

  checkMaxReservationsAndMaxRounds = async (
    userId: string,
    roundsToBook: number,
    courseId: string
  ): Promise<MaxReservationsAndMaxRoundsResult | undefined> => {
    const twentyFourHoursAgo = dayjs().subtract(24, "hour").format("YYYY-MM-DD HH:mm:ss");

    try {
      const courseData = await this.database
        .select({
          maxRoundsPerPeriod: courses.maxRoundsPerPeriod,
          maxBookingsPerPeriod: courses.maxBookingsPerPeriod,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .execute();

      if (!courseData) {
        throw new Error("Course data not found.");
      }

      const booking = await this.database
        .select({
          ownerId: bookings.ownerId,
          playerCount: bookings.playerCount,
        })
        .from(bookings)
        .where(and(eq(bookings.ownerId, userId), gte(bookings.purchasedAt, twentyFourHoursAgo)))
        .execute();

      if (!bookings) {
        throw new Error("Bookings data not found.");
      }

      const numberOfBookings = booking.length;
      const numberOfRounds = booking.reduce((total, booking) => total + booking.playerCount, 0);

      console.log("=======courseData====", courseData, numberOfRounds, numberOfBookings);

      const maxRoundsPerPeriod = courseData[0]?.maxRoundsPerPeriod;
      const maxBookingsPerPeriod = courseData[0]?.maxBookingsPerPeriod;

      const exceedsRounds =
        maxRoundsPerPeriod !== null &&
        maxRoundsPerPeriod !== undefined &&
        numberOfRounds + roundsToBook > maxRoundsPerPeriod;
      const exceedsBookings =
        maxBookingsPerPeriod !== null &&
        maxBookingsPerPeriod !== undefined &&
        numberOfBookings + 1 > maxBookingsPerPeriod;

      if (exceedsBookings) {
        console.error("User exceeds max bookings per period.");
        return {
          success: false,
          message: "You have already reached the maximum number of bookings allowed for a 24 hour period.",
        };
      }

      if (exceedsRounds) {
        console.error("User exceeds max rounds per period.");
        return {
          success: false,
          message: "You have already exceeded the maximum number of rounds allowed per 24 hour period.",
        };
      }

      console.log("User can proceed with booking.");
      return { success: true, message: "" };
    } catch (error) {
      console.error("Error in validation:", error);
      return { success: false, message: "An error occurred during validation." };
    }
  };

  buildCheckoutSession = async (
    userId: string,
    customerCartData: CustomerCart,
    cartId = "",
    ipAddress?: string
  ) => {
    const { paymentId } = customerCartData;
    let data = {} as CheckoutTypes;

    // const errors = await this.validateCartItems(customerCart);
    // if (errors.length > 0) {
    //   return {
    //     errors: errors,
    //   };
    // }
    console.log("userId ", userId);
    console.log("customerCartData ", JSON.stringify(customerCartData));
    console.log("cartId ", cartId);
    console.log("ipAddress ", ipAddress);
    console.log("paymentId ", paymentId);
    if (paymentId) {
      data = await this.updateCheckoutSession(userId, customerCartData, cartId);
    } else {
      data = await this.createCheckoutSession(userId, customerCartData, ipAddress);
    }
    if (data?.error) {
      return { error: data.error };
    }
    return data;
  };

  createCheckoutSession = async (userId: string, customerCartData: CustomerCart, ipAddress?: string) => {
    const { paymentId: _, ...customerCart } = customerCartData;

    this.logger.debug(`${JSON.stringify(customerCart)}`);
    const [user] = await this.database
      .select({
        name: users.name,
        email: users.email,
        phoneNumber: users.phoneNumber,
        id: users.id,
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
    const skipItemsForTotal = [
      "markup",
      "cart_fee",
      "greenFeeTaxPercent",
      "cartFeeTaxPercent",
      "weatherGuaranteeTaxPercent",
      "markupTaxPercent",
    ];

    let total = customerCart.cart
      .filter(({ product_data }) => !skipItemsForTotal.includes(product_data.metadata.type))
      .reduce((acc, item) => {
        return acc + item.price;
      }, 0);

    const isFirstHand = customerCart.cart.filter(
      ({ product_data }) => product_data.metadata.type === "first_hand"
    );
    const isFirstHandGroup = customerCart.cart.filter(
      ({ product_data }) => product_data.metadata.type === "first_hand_group"
    );
    const sensibleCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "sensible")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    const markupCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "markup")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    const cartFeeCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "cart_fee")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    if (isFirstHand.length) {
      if (isFirstHand[0]?.product_data.metadata.type === "first_hand") {
        const teetimeId = customerCart?.teeTimeId ?? "";
        const [teeTime] = await this.database
          .select({
            id: teeTimes.id,
            greenFees: teeTimes.greenFeePerPlayer,
            cartFees: teeTimes.cartFeePerPlayer,
            greenFeeTaxPercent: courses.greenFeeTaxPercent,
            cartFeeTaxPercent: courses.cartFeeTaxPercent,
            weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
            markupTaxPercent: courses.markupTaxPercent,
          })
          .from(teeTimes)
          .leftJoin(courses, eq(teeTimes.courseId, courses.id))
          .where(eq(teeTimes.id, teetimeId))
          .execute()
          .catch((err) => {
            throw new Error(`Error finding tee time id`);
          });
        const playerCount = isFirstHand[0]?.product_data.metadata.number_of_bookings;
        const greenFeeTaxTotal =
          ((teeTime?.greenFees ?? 0) / 100) * ((teeTime?.greenFeeTaxPercent ?? 0) / 100 / 100) * playerCount;
        const markupTaxTotal = (markupCharge / 100) * ((teeTime?.markupTaxPercent ?? 0) / 100) * playerCount;
        const weatherGuaranteeTaxTotal =
          (sensibleCharge / 100) * ((teeTime?.weatherGuaranteeTaxPercent ?? 0) / 100);
        const cartFeeTaxPercentTotal =
          ((cartFeeCharge * ((teeTime?.cartFeeTaxPercent ?? 0) / 100)) / 100) * playerCount;
        const additionalTaxes = Number(
          (greenFeeTaxTotal + markupTaxTotal + weatherGuaranteeTaxTotal + cartFeeTaxPercentTotal).toFixed(2)
        );
        total = total + additionalTaxes * 100;
      }
    }

    if (isFirstHandGroup.length) {
      if (isFirstHandGroup[0]?.product_data.metadata.type === "first_hand_group") {
        const playerCount = isFirstHandGroup[0]?.product_data.metadata.number_of_bookings;
        const teeTimeIds = isFirstHandGroup[0]?.product_data.metadata.tee_time_ids;
        const teeTimesResponse = await this.database
          .selectDistinct({
            id: teeTimes.id,
            greenFees: teeTimes.greenFeePerPlayer,
            cartFees: teeTimes.cartFeePerPlayer,
            greenFeeTaxPercent: courses.greenFeeTaxPercent,
            cartFeeTaxPercent: courses.cartFeeTaxPercent,
            weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
            markupTaxPercent: courses.markupTaxPercent,
            groupBookingPriceSelectionMethod: courseSetting.value,
          })
          .from(teeTimes)
          .leftJoin(courses, eq(teeTimes.courseId, courses.id))
          .leftJoin(
            courseSetting,
            and(
              eq(courseSetting.courseId, courses.id),
              eq(courseSetting.internalName, "GROUP_BOOKING_PRICE_SELECTION_METHOD")
            )
          )
          .where(inArray(teeTimes.id, teeTimeIds))
          .execute()
          .catch((err) => {
            this.logger.error(`Error finding tee time ids: ${JSON.stringify(err)}`);
            throw new Error(`Error finding tee time ids`);
          });

        if (!teeTimesResponse?.length) {
          throw new Error(`Error finding tee times with ids: ${JSON.stringify(teeTimeIds)}`);
        }
        const teeTime = teeTimesResponse[0];
        const groupBookingPriceSelectionMethod = teeTime?.groupBookingPriceSelectionMethod ?? "MAX";
        let greenFees = 0;

        // get fees for players
        if (groupBookingPriceSelectionMethod === "MAX") {
          for (const teeTime of teeTimesResponse) {
            greenFees = Math.max(greenFees, teeTime.greenFees);
          }
        } else if (groupBookingPriceSelectionMethod === "SUM") {
          let totalGreenFees = 0;
          for (const teeTime of teeTimesResponse) {
            totalGreenFees += teeTime.greenFees;
          }
          greenFees = totalGreenFees / playerCount;
        } else {
          throw new Error("Invalid groupBookingPriceSelectionMethod");
        }

        const greenFeeTaxTotal =
          ((greenFees ?? 0) / 100) * ((teeTime?.greenFeeTaxPercent ?? 0) / 100 / 100) * playerCount;
        const markupTaxTotal = (markupCharge / 100) * ((teeTime?.markupTaxPercent ?? 0) / 100) * playerCount;
        const weatherGuaranteeTaxTotal =
          (sensibleCharge / 100) * ((teeTime?.weatherGuaranteeTaxPercent ?? 0) / 100);
        const cartFeeTaxPercentTotal =
          ((cartFeeCharge * ((teeTime?.cartFeeTaxPercent ?? 0) / 100)) / 100) * playerCount;
        const additionalTaxes = Number(
          (greenFeeTaxTotal + markupTaxTotal + weatherGuaranteeTaxTotal + cartFeeTaxPercentTotal).toFixed(2)
        );
        total = total + additionalTaxes * 100;
      }
    }
    // const tax = await this.stripeService.getTaxRate(customerCart.cart).catch((err) => {
    //   this.logger.error(`Error calculating tax: ${err}`);
    //   throw new Error(`Error calculating tax: ${err}`);
    // });
    //@TODO: metadata to include sensible
    //@TODO: update total form discount
    // debugger;
    const [record] = await this.database
      .select({
        internalId: providers.internalId,
      })
      .from(providerCourseLink)
      .innerJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(providerCourseLink.courseId, customerCart.courseId))
      .execute();
    const paymentData = {
      // @ts-ignore
      customer_id: customerCart.customerId,
      name: user.name,
      email: user.email,
      phone: user.phoneNumber,
      amount: parseInt(total.toString()),
      currency: "USD",
      profile_id: this.profileId,
      // @ts-ignore
      metadata: {
        courseId: customerCart.courseId,
        userId: user?.id,
        teeTimeId: customerCart?.teeTimeId,
        courseName: customerCart?.courseName,
        playDateTime: customerCart?.playDateTime,
        cartId: customerCart?.cartId,
      },
      merchant_order_reference_id: customerCartData?.cartId ?? "",
      setup_future_usage: "off_session",
    };
    // }

    // const paymentIntent = await this.hyperSwitch.createPaymentIntent(paymentData).catch((err) => {
    //   this.logger.error(` ${err}`);
    //   loggerService.errorLog({
    //     userId,
    //     url: "/CheckoutService/createCheckoutSession",
    //     userAgent: "",
    //     message: "ERROR_CREATING_PAYMENT_INTENT",
    //     stackTrace: `${err.stack}`,
    //     additionalDetailsJSON: JSON.stringify({
    //       customerCartData,
    //       paymentData,
    //     }),
    //   });
    //   throw new Error(`Error creating payment intent: ${err}`);
    // });
    let paymentIntent;
    try {
      paymentIntent = await this.hyperSwitch.createPaymentIntent(paymentData);
    } catch (err: any) {
      this.logger.error(` ${err}`);
      loggerService.errorLog({
        userId,
        url: "/CheckoutService/createCheckoutSession",
        userAgent: "",
        message: "ERROR_CREATING_PAYMENT_INTENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          customerCartData,
          paymentData,
        }),
      });
      return {
        error: "Currently we are not able to process the payment please reload",
        clientSecret: "",
        paymentId: "",
        cartId: "",
        next_action: "",
      };
    }

    let teeTimeId;
    let listingId;

    customerCartData?.cart?.forEach(({ product_data }: ProductData) => {
      if (product_data.metadata.type === "first_hand") {
        teeTimeId = product_data.metadata.tee_time_id;
      }
      if (product_data.metadata.type === "second_hand") {
        listingId = product_data.metadata.second_hand_id;
      }
      if (product_data.metadata.type === "first_hand_group") {
        teeTimeId = product_data.metadata.tee_time_ids[0];
      }
    });

    //save customerCart to database
    const cartId: string = randomUUID();
    const ipInfo = await this.ipInfoService.getIpInfo(ipAddress);
    await this.database.insert(customerCarts).values({
      id: cartId,
      userId: userId,
      // courseId: customerCart.courseId,
      paymentId: paymentIntent.payment_id,
      cart: customerCart,
      listingId,
      teeTimeId,
      ipinfoJSON: ipInfo,
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.payment_id,
      cartId: cartId,
      next_action: paymentIntent.next_action,
    };
  };

  updateCheckoutSession = async (userId: string, customerCartData: CustomerCart, cartId: string) => {
    const { paymentId, ...customerCart } = customerCartData;

    const errors = await this.validateCartItems(customerCartData);
    console.log("errors ", JSON.stringify(errors));

    const skipItemsForTotal = [
      "markup",
      "cart_fee",
      "greenFeeTaxPercent",
      "cartFeeTaxPercent",
      "weatherGuaranteeTaxPercent",
      "markupTaxPercent",
    ];

    let total: number = customerCart.cart
      .filter(({ product_data }) => !skipItemsForTotal.includes(product_data.metadata.type))
      .reduce((acc, item) => {
        return acc + item.price;
      }, 0);

    const isFirstHand = customerCart.cart.filter(
      ({ product_data }) => product_data.metadata.type === "first_hand"
    );
    const sensibleCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "sensible")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    const markupCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "markup")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    const cartFeeCharge =
      customerCartData?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "cart_fee")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    if (isFirstHand.length) {
      if (isFirstHand[0]?.product_data.metadata.type === "first_hand") {
        const teetimeId = customerCart?.teeTimeId ?? "";
        const [teeTime] = await this.database
          .select({
            id: teeTimes.id,
            greenFees: teeTimes.greenFeePerPlayer,
            cartFees: teeTimes.cartFeePerPlayer,
            greenFeeTaxPercent: courses.greenFeeTaxPercent,
            cartFeeTaxPercent: courses.cartFeeTaxPercent,
            weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
            markupTaxPercent: courses.markupTaxPercent,
          })
          .from(teeTimes)
          .leftJoin(courses, eq(teeTimes.courseId, courses.id))
          .where(eq(teeTimes.id, teetimeId))
          .execute()
          .catch((err) => {
            throw new Error(`Error finding tee time id`);
          });
        const playerCount = isFirstHand[0]?.product_data.metadata.number_of_bookings;
        const greenFeeTaxTotal =
          ((teeTime?.greenFees ?? 0) / 100) * ((teeTime?.greenFeeTaxPercent ?? 0) / 100 / 100) * playerCount;
        const markupTaxTotal = (markupCharge / 100) * ((teeTime?.markupTaxPercent ?? 0) / 100) * playerCount;
        const weatherGuaranteeTaxTotal =
          (sensibleCharge / 100) * ((teeTime?.weatherGuaranteeTaxPercent ?? 0) / 100);
        const cartFeeTaxPercentTotal =
          ((cartFeeCharge * ((teeTime?.cartFeeTaxPercent ?? 0) / 100)) / 100) * playerCount;
        const additionalTaxes = Number(
          (greenFeeTaxTotal + markupTaxTotal + weatherGuaranteeTaxTotal + cartFeeTaxPercentTotal).toFixed(2)
        );
        total = total + additionalTaxes * 100;
      }
    }
    console.log(`paymentId = ${paymentId}`);
    console.log(`total = ${total}`);
    console.log(`userId = ${userId}`);
    console.log(`cartId = ${cartId}`);
    console.log(customerCartData);

    // let intentData;

    const [record] = await this.database
      .select({
        internalId: providers.internalId,
      })
      .from(providerCourseLink)
      .innerJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(providerCourseLink.courseId, customerCart.courseId))
      .execute();

    const intentData = {
      currency: "USD",
      amount: parseInt(total.toString()),
      amount_to_capture: parseInt(total.toString()),
      merchant_order_reference_id: cartId ?? "",

      metadata: {
        courseId: customerCart.courseId,
        userId: userId,
        teeTimeId: customerCart?.teeTimeId,
        courseName: customerCart?.courseName,
        playDateTime: customerCart?.playDateTime,
        cartId: customerCart?.cartId,
      },
    };

    // @ts-ignore
    // const paymentIntent = await this.hyperSwitch
    //   .updatePaymentIntent(paymentId || "", intentData, userId)
    //   .catch((err) => {
    //     this.logger.error(` ${err}`);
    //     loggerService.errorLog({
    //       userId,
    //       url: "/CheckoutService/updateCheckoutSession",
    //       userAgent: "",
    //       message: "ERROR_UPDATING_PAYMENT_INTENT",
    //       stackTrace: `${err.stack}`,
    //       additionalDetailsJSON: JSON.stringify({
    //         cartId,
    //         paymentId,
    //       }),
    //     });
    //     throw new Error(`Error updating payment intent: ${err}`);
    //   });
    let paymentIntent;
    try {
      paymentIntent = await this.hyperSwitch.updatePaymentIntent(paymentId || "", intentData, userId);
    } catch (error: any) {
      this.logger.error(` ${error}`);
      loggerService.errorLog({
        userId,
        url: "/CheckoutService/updateCheckoutSession",
        userAgent: "",
        message: "ERROR_UPDATING_PAYMENT_INTENT",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          cartId,
          paymentId,
        }),
      });
      return {
        error: "Currently we are not able to process the payment please reload",
        clientSecret: "",
        paymentId: "",
        cartId: "",
        next_action: "",
      };
    }

    let teeTimeId;
    let listingId;

    customerCartData?.cart?.forEach(({ product_data }: ProductData) => {
      if (product_data.metadata.type === "first_hand") {
        teeTimeId = product_data.metadata.tee_time_id;
      }
      if (product_data.metadata.type === "second_hand") {
        listingId = product_data.metadata.second_hand_id;
      }
      if (product_data.metadata.type === "first_hand_group") {
        teeTimeId = product_data.metadata.tee_time_ids[0];
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
        loggerService.errorLog({
          userId,
          url: "/CheckoutService/updateCheckoutSession",
          userAgent: "",
          message: "ERROR_UPDATING_CUSTOMER_CART",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            paymentId,
            cartId,
          }),
        });
        throw new Error("Error updating customer cart");
      });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentId: paymentIntent.payment_id,
      cartId,
      next_action: paymentIntent.next_action,
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
        case "greenFeeTaxPercent":
          errors.push(...(await this.validateGreenFeeTaxPercentItem(item as GreenFeeTaxPercentProduct)));
          break;
        case "cartFeeTaxPercent":
          errors.push(...(await this.validateCartFeeTaxPercentItem(item as CartFeeTaxPercentProduct)));
          break;
        case "markupTaxPercent":
          errors.push(...(await this.validateMarkupTaxPercentItem(item as MarkupTaxPercentProduct)));
          break;
        case "weatherGuaranteeTaxPercent":
          errors.push(
            ...(await this.validateWeatherGuaranteeTaxPercentItem(item as WeatherGuaranteeTaxPercentProduct))
          );
          break;
        case "cart_fee":
          console.log(" switch in cart-fee");
          break;
        default:
          this.logger.error(`Unknown product type: ${JSON.stringify(item.product_data.metadata)}`);
          loggerService.errorLog({
            userId: "",
            url: "/CheckoutService/validateCartItems",
            userAgent: "",
            message: "UNKNOWN_PRODUCT_TYPE",
            stackTrace: `Unknown product type: ${item.product_data.metadata}`,
            additionalDetailsJSON: JSON.stringify({
              customerCart,
            }),
          });
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
        providerDate: teeTimes.providerDate,
        providerCourseId: providerCourseLink.providerCourseId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        providerId: providerCourseLink.providerId,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
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
        loggerService.errorLog({
          userId: "",
          url: "/CheckoutService/validateFirstHandItem",
          userAgent: "",
          message: "ERROR_FINDING_TEE_TIME",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            item,
          }),
        });
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
      teeTime.courseId,
      teeTime.providerCourseConfiguration!
    );

    // const [formattedDate] = teeTime.date.split(" ");
    const [formattedDateUTC] = teeTime.date.split(" ");
    const [formattedDate] = teeTime.providerDate.split("T");
    console.log(`formattedDateUTC: ${formattedDateUTC}`);
    console.log(`formattedDate: ${formattedDate}`);

    if (teeTime.providerCourseId && teeTime.providerTeeSheetId && formattedDate) {
      let response;
      response = await provider.indexTeeTime(
        formattedDate,
        teeTime.providerCourseId,
        teeTime.providerTeeSheetId,
        provider,
        token,
        teeTime.time,
        teeTime.id,
        teeTime.providerTeeTimeId
      );
      if (response?.error) {
        errors.push({
          errorType: CartValidationErrors.TEE_TIME_NOT_AVAILABLE,
          product_id: item.id,
        });
      }
    }
    console.log("teeTime", item.product_data);
    console.log("NUmber of bookings", item.product_data.metadata.number_of_bookings);
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
      .catch((_err) => {
        throw new Error("Error retrieving teetime");
      });
    console.log("stillAvailable", JSON.stringify(stillAvailable));
    if (stillAvailable.length == 0) {
      errors.push({
        errorType: CartValidationErrors.TEE_TIME_NOT_AVAILABLE,
        product_id: item.id,
      });
      throw new Error("Expected Tee time spots may not be available anymore. Please select another time.");
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
        loggerService.errorLog({
          userId: "",
          url: "/CheckoutService/validateSecondHandItem",
          userAgent: "",
          message: "ERROR_FINDING_LISTING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            item,
          }),
        });
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

  validateGreenFeeTaxPercentItem = async (
    item: GreenFeeTaxPercentProduct
  ): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateCartFeeTaxPercentItem = async (item: CartFeeTaxPercentProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateMarkupTaxPercentItem = async (item: MarkupTaxPercentProduct): Promise<CartValidationError[]> => {
    const errors: CartValidationError[] = [];
    //@TODO: validate quote
    return errors;
  };

  validateWeatherGuaranteeTaxPercentItem = async (
    item: WeatherGuaranteeTaxPercentProduct
  ): Promise<CartValidationError[]> => {
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
        loggerService.errorLog({
          userId: "",
          url: "/CheckoutService/validateCharityItem",
          userAgent: "",
          message: "ERROR_GETTING_CHARITY",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            item,
            courseId,
          }),
        });
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
        loggerService.errorLog({
          userId: "",
          url: "/CheckoutService/validateOfferItem",
          userAgent: "",
          message: "ERROR_GETTING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            item,
          }),
        });
        throw new Error("Error retrieving bookings");
      });
    if (!data.length || data.length !== bookingIds.length || !data[0]) {
      this.logger.warn(`No bookings found.`);
      loggerService.errorLog({
        userId: "",
        url: "/CheckoutService/validateOfferItem",
        userAgent: "",
        message: "NO_BOOKINGS_FOUND",
        stackTrace: `No bookings found`,
        additionalDetailsJSON: JSON.stringify({
          item,
        }),
      });
      throw new Error("No bookings found");
    }
    const firstTeeTime = data[0].teeTimeId;
    if (!data.every((booking) => booking.teeTimeId === firstTeeTime)) {
      this.logger.error(`All bookings must be under the same tee time.`);
      loggerService.errorLog({
        userId: "",
        url: "/CheckoutService/validateOfferItem",
        userAgent: "",
        message: "ALL_BOOKINGS_MUST_BE_UNDER_THE_SAME_TEE_TIME",
        stackTrace: `All bookings must be under the same tee time.`,
        additionalDetailsJSON: JSON.stringify({
          item,
        }),
      });
      throw new Error("All bookings must be under the same tee time.");
    }
    //price must to higher than the largest minimum offer price

    const minimumOfferPrice = Math.max(...data.map((booking) => booking.minimumOfferPrice));
    if (price < minimumOfferPrice) {
      this.logger.error(`Offer price must be higher than the minimum offer price.`);
      loggerService.errorLog({
        userId: "",
        url: "/CheckoutService/validateOfferItem",
        userAgent: "",
        message: "OFFER_PRICE_MUST_BE_HIGHER_THAN_THE_MINIMUM_OFFER_PRICE",
        stackTrace: `Offer price must be higher than the minimum offer price.`,
        additionalDetailsJSON: JSON.stringify({
          item,
        }),
      });
      throw new Error("Offer price must be higher than the minimum offer price.");
    }
    return errors;
  };
  checkMultipleTeeTimeTransactionByUser = async (userId: string) => {
    try {
      //"USER_BUY_MULTIPLE_TEETIME_IN_SAME_DAY",
      let appSettingsResult: any = [];
      let appSettingsValue: number;
      appSettingsResult = await this.appSettings.getAppSetting("USER_BUY_MULTIPLE_TEETIME_IN_SAME_DAY");
      appSettingsValue = Number(appSettingsResult.value);

      const [userResult] = await this.database
        .select({
          bookingCount: sql`Count(${bookings.id})`.as("bookingCount"),
        })
        .from(bookings)
        .where(
          and(
            eq(bookings.ownerId, userId ?? ""),
            gte(bookings.purchasedAt, sql`NOW() - INTERVAL ${appSettingsValue} HOUR`)
          )
        );
      return { data: Number(userResult?.bookingCount) || 1 };
    } catch (error: any) {
      this.logger.error("", error.message);
      throw error.message;
    }
  };
  createHyperSwitchNewCustomer = async (userId: string) => {
    try {
      const [userDetails] = await this.database.select().from(users).where(eq(users.id, userId));
      if (!userDetails) {
        throw new Error("User details not found");
      }
      const parts = userDetails?.email?.split("@") || [];
      const hyperswitchCreateCustomer = `${process.env.HYPERSWITCH_BASE_URL}/customers`;
      const myHeaders = new Headers();
      myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY ?? "");
      myHeaders.append("Content-Type", "application/json");
      const customerDataObject = {
        customer_id: parts[0]!,
        name: userDetails.name!,
        email: userDetails.email,
        phone: userDetails.phoneNumber!,
        description: "default",
        // address: {
        //   city: userDetails.city || "",
        //   country: userDetails.country || "",
        //   line1: userDetails.address1 || "",
        //   line2: userDetails.address2 || "",
        //   zip: userDetails.zipcode || "",
        //   state: userDetails.state || "",
        // },
      };
      console.log(JSON.stringify(customerDataObject));
      const requestOptions = {
        method: "POST",
        headers: myHeaders,
        body: JSON.stringify(customerDataObject),
      };
      const response = await fetch(hyperswitchCreateCustomer, requestOptions);
      const customerData = await response.json();
      if (customerData.error && customerData?.error?.type === "invalid_request") {
        return { error: true, message: customerData?.error?.message, code: customerData?.error?.code };
      }
      return { data: customerData?.customer_id || "", status_api: true, response: customerData };
    } catch (error: any) {
      console.log("error message", error.message);
    }
  };
  retrieveHyperSwitchRegisteredCustomer = async (userId: string) => {
    try {
      const [userDetails] = await this.database.select().from(users).where(eq(users.id, userId));
      if (!userDetails) {
        throw new Error("User details not found");
      }
      const parts = userDetails?.email?.split("@") || [];
      const retrieveHyperSwitchCustomerData = `${process.env.HYPERSWITCH_BASE_URL}/customers/${parts[0]}`;
      const myHeaders = new Headers();
      myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY ?? "");
      const requestOptions = {
        method: "GET",
        headers: myHeaders,
      };
      const response = await fetch(retrieveHyperSwitchCustomerData, requestOptions);
      const customerData = await response.json();
      if (customerData.error && customerData?.error?.type === "invalid_request") {
        return { error: true, message: customerData?.error?.message, code: customerData?.error?.code };
      }
      return { data: customerData?.customer_id || "", status_api: true, error: false };
    } catch (error: any) {
      console.log("error message", error.message);
    }
  };
  searchCustomerAndValidate = async (
    userId: string,
    teeTimeId: string,
    email: string,
    selectedProviderCourseMembershipId: string
  ) => {
    const [teeTimeResult] = await this.database
      .select({
        courseId: teeTimes.courseId,
        providerCourseId: providerCourseLink.providerCourseId,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        providerInternalId: providers.internalId,
        providerTeeSheet: providerCourseLink.providerTeeSheetId,
      })
      .from(teeTimes)
      .leftJoin(providerCourseLink, eq(teeTimes.courseId, providerCourseLink.courseId))
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(teeTimes.id, teeTimeId));
    const result = await this.providerService.searchCustomerViaEmail(
      email,
      teeTimeResult?.providerInternalId ?? "",
      teeTimeResult?.providerCourseId ?? "",
      teeTimeResult?.providerTeeSheet ?? "",
      teeTimeResult?.providerCourseConfiguration ?? ""
    );
    if (!Array.isArray(result) || result.length === 0) {
      return {
        isValidated: false,
        providerCourseMembership: "",
        message: "This Customer is not registered for Loyalty",
      };
    }
    const checkingGroupsLoyalty = await this.database
      .select({
        name: providerCourseMembership.name,
        courseMemberShipId: courseMembership.id,
        providerCourseMembershipId: providerCourseMembership.id,
      })
      .from(courseMembership)
      .leftJoin(
        providerCourseMembership,
        eq(providerCourseMembership.courseMembershipId, courseMembership.id)
      )
      .where(
        and(
          eq(courseMembership.courseId, teeTimeResult?.courseId ?? ""),
          isNotNull(providerCourseMembership.id),
          eq(courseMembership.id, selectedProviderCourseMembershipId)
        )
      );
    // console.log(selectedProviderCourseMembershipId);
    // console.log("checkingGroupsLoyalty======>", checkingGroupsLoyalty);
    const dummyCreatedAnswer = result.map((item: any) => {
      return item;
    });
    // add validation for groups if they are empty
    const dummyResult = dummyCreatedAnswer[0]?.attributes?.groups;
    if (dummyResult.length === 0) {
      return {
        isValidated: false,
        providerCourseMembership: "",
        providerCourseMembershipId: "",
        message: "User Is registered but not part of any loyalty group",
      };
    }
    const anyIncluded = checkingGroupsLoyalty.some((item) => dummyResult.includes(item.name));
    console.log("anyIncluded=============>", anyIncluded);
    if (!anyIncluded) {
      return {
        isValidated: anyIncluded,
        providerCourseMembership: "",
        providerCourseMembershipId: "",
        message: "mismatch in loyalty group",
      };
    }
    return {
      isValidated: anyIncluded,
      providerCourseMembership: checkingGroupsLoyalty[0]?.courseMemberShipId,
      providerCourseMembershipId: checkingGroupsLoyalty[0]?.providerCourseMembershipId,
      message: "User Validated successfully",
    };
  };
  getAllCourseMembership = async () => {
    const courseMemberShipResult = await this.database
      .select({
        id: courseMembership.id,
        name: courseMembership.name,
      })
      .from(courseMembership);
    console.log("providerCourseMemberShipResult", courseMemberShipResult);
    return courseMemberShipResult || [];
  };
  isAppleEnabledReloadWidget = async () => {
    const appSettingsResult = await this.appSettings.getAppSetting("IS_ENABLED_APPLE_PAY");
    return appSettingsResult?.value === "1" ? true : false;
  };
}

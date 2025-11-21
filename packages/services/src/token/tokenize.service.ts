import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, db, eq, inArray } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import type { InsertBookingSlots } from "@golf-district/database/schema/bookingslots";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { entities } from "@golf-district/database/schema/entities";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import type { InsertTransfer } from "@golf-district/database/schema/transfers";
import { transfers } from "@golf-district/database/schema/transfers";
import { users } from "@golf-district/database/schema/users";
import { formatMoney, formatTime, formatTimeWithoutDate } from "@golf-district/shared";
import createICS from "@golf-district/shared/createICS";
import type { Event } from "@golf-district/shared/createICS";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import type { MerchandiseProduct, MerchandiseWithTaxOverride, ProductData } from "../checkout/types";
import type { NotificationService } from "../notification/notification.service";
import type { SensibleService } from "../sensible/sensible.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import { loggerService } from "../webhooks/logging.service";
import type { ProviderBooking } from "../booking/booking.service";
import { groupBookings } from "@golf-district/database/schema/groupBooking";
import {
  bookingMerchandise,
  type InsertBookingMerchandise,
} from "@golf-district/database/schema/bookingMerchandise";
import {
  courseMerchandise,
  type SelectCourseMerchandise,
} from "@golf-district/database/schema/courseMerchandise";

/**
 * Service class for handling booking tokenization, transfers, and updates.
 */

interface AcceptedQuoteParams {
  id: string | null;
  price_charged: number;
}
interface BookingTypes {
  validForCollectPayment: boolean;
  bookingId: string;
  isEmailSend: boolean;
}

export interface MerchandiseItem {
  id: string;
  qoh: number;
  caption: string;
}

export class TokenizeService {
  private logger = Logger(TokenizeService.name);

  /**
   * Constructor for the `TokenizeService` class.
   *
   * @param {Db} database - The database instance.
   * @example
   * const tokenizeService = new TokenizeService(database);
   */
  constructor(
    private readonly database: Db,
    private readonly notificationService: NotificationService,
    private readonly sensibleService: SensibleService
  ) { }
  getCartData = async ({ courseId = "", ownerId = "", paymentId = "" }) => {
    const [customerCartData]: any = await this.database
      .select({ cart: customerCarts.cart, cartId: customerCarts.id })
      .from(customerCarts)
      .where(
        and(
          // eq(customerCarts.courseId, courseId),
          eq(customerCarts.userId, ownerId),
          eq(customerCarts.paymentId, paymentId)
        )
      )
      .execute();

    const primaryGreenFeeCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "first_hand")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const convenienceCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "convenience_fee")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const taxCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "taxes")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const sensibleCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "sensible")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const charityCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "charity")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const charityId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "charity"
    )?.product_data.metadata.charity_id;

    const weatherQuoteId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "sensible"
    )?.product_data.metadata.sensible_quote_id;

    const taxes = taxCharge + sensibleCharge + charityCharge + convenienceCharge;

    const total = customerCartData?.cart?.cart
      .filter(({ product_data }: ProductData) => product_data.metadata.type !== "markup")
      .reduce((acc: number, i: any) => {
        return acc + i.price;
      }, 0);

    return {
      primaryGreenFeeCharge,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      taxes,
      total,
      cartId: customerCartData?.cartId,
      charityId,
      weatherQuoteId,
    };
  };
  /**
   * Tokenize a booking for a user. This function either books an existing tee time or creates a new one based on the provided details.
   *
   * @param userId - The unique identifier of the user initiating the booking.
   * @param expiration - The date and time when the booking will expire.
   * @param numberOfHoles - The number of holes the user wants to play.
   * @param courseId - The unique identifier of the course where the booking is made.
   * @param purchasedFor - The amount for which the booking was purchased.
   * @param teeTimeInfo - Optional information related to the tee time. It can contain:
   *   - `teeTimeId`: An existing tee time ID if booking an existing slot.
   *   - `numberOfPlayers`: The number of players for the tee time.
   *   - `override`: Overrides for the booking details, which can include:
   *     - `carts`: Number of carts required.
   *     - `numberOfHoles`: Number of holes if different from the main parameter.
   *     - `maxBookings`: Maximum bookings allowed for the tee time.
   *     - `entityId`: Entity associated with the tee time.
   * @returns A promise that resolves once the booking is successfully tokenized.
   * @throws Error - Throws an error if:
   *   - The userId is not provided.
   *   - The specified tee time does not exist.
   *   - The maximum bookings for a tee time have been reached.
   *   - There are issues interacting with the underlying data store (Prisma).
   */
  async tokenizeBooking({
    redirectHref,
    userId,
    purchasePrice,
    players,
    providerBookingId,
    providerTeeTimeId,
    paymentId,
    withCart,
    provider,
    token,
    teeTime,
    normalizedCartData,
    isWebhookAvailable,
    providerBookingIds,
    cartFeeCharge,
    additionalTaxes,
    source,
    additionalNoteFromUser,
    needRentals,
    courseMembershipId,
    playerCountForMemberShip,
    providerCourseMembershipId,
    isFirstHandGroupBooking,
    providerBookings,
    purchasedMerchandise = [],
    color1,
  }: {
    redirectHref: string;
    userId: string;
    purchasePrice: number;
    players: number; //how many bookings to make
    providerBookingId: string; //the tee time ids to book
    providerTeeTimeId: string; //all tee times to be tokenized are purchased from a provider
    paymentId: string;
    withCart?: boolean;
    provider?: ProviderAPI;
    token?: string;
    cartFeeCharge?: number;
    teeTime?: {
      id: string;
      courseId: string;
      date: string;
      providerCourseId: string | null;
      providerTeeSheetId: string | null;
      providerId: string | null;
      internalId: string | null;
      providerDate: string;
      holes: number;
    };
    normalizedCartData?: any;
    isWebhookAvailable?: boolean;
    providerBookingIds?: string[];
    additionalTaxes: {
      greenFeeTaxTotal: number;
      markupTaxTotal: number;
      weatherGuaranteeTaxTotal: number;
      cartFeeTaxPercentTotal: number;
      additionalTaxes: number;
      merchandiseTaxTotal: number;
    };
    source: string;
    additionalNoteFromUser?: string;
    needRentals: boolean;
    courseMembershipId?: string;
    playerCountForMemberShip?: string;
    providerCourseMembershipId?: string;
    isFirstHandGroupBooking?: boolean;
    providerBookings?: ProviderBooking[];
    purchasedMerchandise?: MerchandiseItem[];
    color1?: string;
  }): Promise<BookingTypes> {
    this.logger.info(`tokenizeBooking tokenizing booking id: ${providerTeeTimeId} for user: ${userId}`);
    //@TODO add this to the transaction

    if (!providerBookings && isFirstHandGroupBooking) {
      this.logger.fatal("No provider bookings found");
      loggerService.errorLog({
        userId: userId,
        url: "/TokenizeService/tokenizeBooking",
        userAgent: "",
        message: "NO_PROVIDER_BOOKINGS",
        stackTrace: "No provider bookings found",
        additionalDetailsJSON: "",
      });
      throw new Error("No provider bookings found");
    }

    const teeTimeIds = providerBookings?.map((booking) => booking.teeTimeId) ?? [];

    console.log(`Retrieving tee time ${providerTeeTimeId}`);
    const existingTeeTimes = await this.database
      .select({
        id: teeTimes.id,
        // entityId: teeTimes.entityId,
        date: teeTimes.date,
        courseId: teeTimes.courseId,
        numberOfHoles: teeTimes.numberOfHoles,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        courseName: courses.name,
        customerName: users.name,
        email: users.email,
        entityName: entities.name,
        providerDate: teeTimes.providerDate,
        address: courses.address,
        name: courses.name,
        websiteURL: courses.websiteURL,
        cdnKey: assets.key,
        extension: assets.extension,
        timezoneCorrection: courses.timezoneCorrection,
      })
      .from(teeTimes)
      .where(isFirstHandGroupBooking ? inArray(teeTimes.id, teeTimeIds) : eq(teeTimes.id, providerTeeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(entities, eq(courses.entityId, entities.id))
      .leftJoin(users, eq(users.id, userId))
      .orderBy(asc(teeTimes.providerDate))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: userId,
          url: "`/TokenizeService/tokenizeBooking`",
          userAgent: "",
          message: "ERROR_GETTING_EXISTING_TEETIME",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            providerTeeTimeId,
            providerBookingId,
          }),
        });
        throw new Error("ERROR_GETTING_EXISTING_TEETIME");
      });

    const existingTeeTime = existingTeeTimes[0];
    if (!existingTeeTimes.length || !existingTeeTime) {
      //how has a booking been created for a tee time that does not exist? big problem
      this.logger.fatal(`TeeTime with ID: ${providerTeeTimeId} does not exist.`);
      loggerService.errorLog({
        userId: userId,
        url: "/reserveBooking",
        userAgent: "",
        message: "TEE TIME NOT FOUND",
        stackTrace: `TeeTime with ID: ${providerTeeTimeId} does not exist.`,
        additionalDetailsJSON: "",
      });
      throw new Error(`TeeTime with ID: ${providerTeeTimeId} does not exist.`);
    }
    // TODO: Shouldn't this logic not be present before sending the booking to the provider?
    // if (existingTeeTime.availableFirstHandSpots < players) {
    //   this.logger.fatal(
    //     `TeeTime with ID: ${providerTeeTimeId} does not have enough spots. spot available - ${existingTeeTime.availableFirstHandSpots}, spot demanded- ${players}`
    //   );

    //   loggerService.auditLog({
    //     id: randomUUID(),
    //     userId,
    //     teeTimeId: "",
    //     bookingId: "",
    //     listingId: "",
    //     eventId: "TEE_TIME_DOES_NOT_HAVE_ENOUGH_SPOTS",
    //     json: `TeeTime with ID: ${providerTeeTimeId} does not have enough spots.`,
    //   });
    //   throw new Error(`TeeTime with ID: ${providerTeeTimeId} does not have enough spots.`);
    // }

    const bookingsToCreate: InsertBooking[] = [];
    const transfersToCreate: InsertTransfer[] = [];
    let bookingSlots: InsertBookingSlots[] = [];
    const merchandiseEntriesToCreate: InsertBookingMerchandise[] = [];
    const merchandiseItemsToUpdate: MerchandiseItem[] = [];
    const merchandiseDetails: { caption: string; qty: number }[] = [];
    const transactionId = randomUUID();
    const bookingId = randomUUID();
    const groupId = randomUUID();
    const bookingIds: string[] = [];
    const teeTimesToUpdate: {
      id: string;
      availableSecondHandSpots: number;
      availableFirstHandSpots: number;
    }[] = [];
    const teeTimeDistributionOnGroupBooking: {
      time: string;
      player: number;
    }[] = [];

    let acceptedQuote: AcceptedQuoteParams = { id: null, price_charged: 0 };

    const isFirstHandBooking = normalizedCartData?.cart?.cart?.some(
      (item: ProductData) => item.product_data.metadata.type === "first_hand"
    );

    console.log(`isFirstHandBooking= ${isFirstHandBooking}`);
    if (isFirstHandBooking || isFirstHandGroupBooking) {
      const weatherGuaranteeData = normalizedCartData.cart?.cart?.filter(
        (item: ProductData) => item.product_data.metadata.type === "sensible"
      );

      console.log(`weatherGuaranteeData length = ${weatherGuaranteeData?.length}`);

      if (weatherGuaranteeData?.length > 0) {
        try {
          acceptedQuote = await this.sensibleService.acceptQuote({
            quoteId: weatherGuaranteeData[0].product_data.metadata.sensible_quote_id,
            price_charged: weatherGuaranteeData[0].price / 100,
            reservation_id: isFirstHandGroupBooking ? groupId : bookingId,
            lang_locale: "en_US",
            user: {
              email: normalizedCartData?.cart?.email,
              name: normalizedCartData.cart?.name,
              phone: normalizedCartData.cart?.phone
                ? `+${normalizedCartData?.cart?.phone_country_code}${normalizedCartData?.cart?.phone}`
                : "",
            },
          });
          console.log("================================+>", acceptedQuote);
        } catch (error: any) {
          const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
          const emailAterSplit = adminEmail.split(",");
          emailAterSplit.map(async (email) => {
            await this.notificationService.sendEmail(
              email,
              "sensible Failed",
              `error while accepting quote in sensible: ${error.message}
                Email: ${normalizedCartData?.cart?.email},
                Name: ${normalizedCartData.cart?.name},
                Phone: ${normalizedCartData.cart?.phone}
                TeeTimeId: ${existingTeeTime.id},
                ProviderBookingID: ${providerBookingId},
              `
            );
          });

          loggerService.errorLog({
            userId: userId,
            url: "/TokenizeService/tokenizeBooking",
            userAgent: "",
            message: "SENSIBLE_ERROR_ACCEPTING_QUOTE",
            stackTrace: `${error.stack}`,
            additionalDetailsJSON: `${JSON.stringify({
              error: error,
              acceptedQuote,
              weatherGuaranteeData,
              normalizedCartData,
              requestBody: {
                quoteId: weatherGuaranteeData[0].product_data.metadata.sensible_quote_id,
                price_charged: weatherGuaranteeData[0].price / 100,
                reservation_id: bookingId,
                lang_locale: "en_US",
                user: {
                  email: normalizedCartData?.cart?.email,
                  name: normalizedCartData.cart?.name,
                  phone: normalizedCartData.cart?.phone
                    ? `+${normalizedCartData?.cart?.phone_country_code}${normalizedCartData?.cart?.phone}`
                    : "",
                },
              },
            })}`,
          });
        }
      }

      const merchandiseData = normalizedCartData.cart?.cart?.filter(
        (item: ProductData) => item.product_data.metadata.type === "merchandise"
      ) as MerchandiseProduct[];

      if (merchandiseData?.length > 0 && merchandiseData[0]!.price > 0) {
        const merchandiseItems = merchandiseData[0]!.product_data.metadata.merchandiseItems;
        for (const merchandise of merchandiseItems) {
          merchandiseEntriesToCreate.push({
            id: randomUUID(),
            bookingId: isFirstHandGroupBooking ? groupId : bookingId,
            courseMerchandiseId: merchandise.id,
            qty: merchandise.qty,
            merchandiseAmountPerItem: merchandise.pricePerItem,
            totalMerchandiseItemTaxAmount: Number(merchandise.taxAmountPerItem * merchandise.qty),
          });
        }

        if (purchasedMerchandise?.length > 0) {
          for (const merchandise of purchasedMerchandise) {
            const merchandiseItem = merchandiseItems.find((item) => item.id === merchandise.id);
            if (merchandiseItem) {
              merchandiseItemsToUpdate.push({
                ...merchandise,
                qoh: merchandise.qoh !== -1 ? merchandise.qoh - merchandiseItem.qty : -1,
              });
              merchandiseDetails.push({
                caption: merchandise.caption,
                qty: merchandiseItem?.qty ?? 0,
              });
            }
          }
        }
      }

      const merchandiseWithTaxOverrideData = normalizedCartData.cart?.cart?.filter(
        (item: ProductData) => item.product_data.metadata.type === "merchandiseWithTaxOverride"
      ) as MerchandiseWithTaxOverride[];

      if (merchandiseWithTaxOverrideData?.length > 0 && merchandiseWithTaxOverrideData[0]!.price > 0) {
        const merchandiseItems = merchandiseWithTaxOverrideData[0]!.product_data.metadata.merchandiseItems;
        for (const merchandise of merchandiseItems) {
          merchandiseEntriesToCreate.push({
            id: randomUUID(),
            bookingId: isFirstHandGroupBooking ? groupId : bookingId,
            courseMerchandiseId: merchandise.id,
            qty: merchandise.qty,
            merchandiseAmountPerItem: merchandise.pricePerItem,
            totalMerchandiseItemTaxAmount: Number(merchandise.taxAmountPerItem * merchandise.qty),
          });
        }

        if (purchasedMerchandise?.length > 0) {
          for (const merchandise of purchasedMerchandise) {
            const merchandiseItem = merchandiseItems.find((item) => item.id === merchandise.id);
            if (merchandiseItem) {
              merchandiseItemsToUpdate.push({
                ...merchandise,
                qoh: merchandise.qoh !== -1 ? merchandise.qoh - merchandiseItem.qty : -1,
              });
              merchandiseDetails.push({
                caption: merchandise.caption,
                qty: merchandiseItem?.qty ?? 0,
              });
            }
          }
        }
      }
    }

    if (isFirstHandGroupBooking && providerBookings) {
      let remainingAmount = Math.ceil(
        (normalizedCartData.total || 0) + additionalTaxes.additionalTaxes * 100
      );

      for (const booking of providerBookings) {
        const isLastBooking = providerBookings.length - bookingIds.length === 1;
        const teeTimeData = existingTeeTimes.find(
          (existingTeeTime) => existingTeeTime.id === booking.teeTimeId
        );
        if (!teeTimeData) {
          this.logger.fatal(`TeeTime with ID: ${booking.teeTimeId} does not exist.`);
          loggerService.errorLog({
            userId: userId,
            url: "/TokenizeService/tokenizeBooking",
            userAgent: "",
            message: "TEE TIME NOT FOUND",
            stackTrace: `TeeTime with ID: ${booking.teeTimeId} does not exist.`,
            additionalDetailsJSON: "",
          });
          throw new Error(`TeeTime with ID: ${booking.teeTimeId} does not exist.`);
        }
        const transactionId = randomUUID();
        const bookingId = randomUUID();
        bookingIds.push(bookingId);
        const totalAmountPerPlayer =
          ((normalizedCartData.total || 0) + additionalTaxes.additionalTaxes * 100) / players;
        const totalAmountForBooking = Math.round(totalAmountPerPlayer * booking.playerCount);

        bookingsToCreate.push({
          id: bookingId,
          providerBookingId: booking.providerBookingId,
          isListed: false,
          numberOfHoles: teeTimeData?.numberOfHoles,
          minimumOfferPrice: 0,
          ownerId: userId,
          teeTimeId: booking.teeTimeId,
          nameOnBooking: teeTimeData?.customerName ?? "Guest",
          includesCart: withCart,
          listId: null,
          cartId: normalizedCartData.cartId,
          playerCount: courseMembershipId ? Number(playerCountForMemberShip) : booking.playerCount ?? 0,
          greenFeePerPlayer: teeTimeData.greenFee + normalizedCartData.advancedBookingAmount * 100 || 0,
          totalTaxesAmount: additionalTaxes.additionalTaxes * 100, // normalizedCartData.taxCharge * 100 || 0,
          charityId: normalizedCartData.charityId || null,
          totalCharityAmount: normalizedCartData.charityCharge * 100 || 0,
          totalAmount:
            isLastBooking && remainingAmount !== totalAmountForBooking
              ? remainingAmount
              : totalAmountForBooking,
          providerPaymentId: paymentId,
          weatherQuoteId: normalizedCartData.weatherQuoteId ?? null,
          weatherGuaranteeId: acceptedQuote?.id ? acceptedQuote?.id : null,
          weatherGuaranteeAmount: acceptedQuote?.price_charged ? acceptedQuote?.price_charged * 100 : 0,
          markupFees: (normalizedCartData?.markupCharge ?? 0) * 100,
          cartFeePerPlayer: cartFeeCharge,
          totalGreenFeeTaxAmount: additionalTaxes.greenFeeTaxTotal * 100,
          totalCartFeeTaxAmount: additionalTaxes.cartFeeTaxPercentTotal * 100,
          totalWeatherGuaranteeTaxAmount: additionalTaxes.weatherGuaranteeTaxTotal * 100,
          totalMarkupFeeTaxAmount: additionalTaxes.markupTaxTotal * 100,
          source: source ? source : null,
          customerComment: additionalNoteFromUser,
          needClubRental: needRentals,
          courseMembershipId: courseMembershipId,
          canResell: courseMembershipId ? 1 : 0,
          groupId: groupId,
          totalMerchandiseAmount: normalizedCartData.merchandiseCharge * 100,
          totalMerchandiseTaxAmount: additionalTaxes.merchandiseTaxTotal * 100,
        });
        transfersToCreate.push({
          id: randomUUID(),
          amount: purchasePrice + additionalTaxes.additionalTaxes * 100,
          purchasedPrice: purchasePrice,
          bookingId: bookingId,
          transactionId: transactionId,
          fromUserId: "0x000", //first hand sales are from the platform
          toUserId: userId,
          courseId: existingTeeTime.courseId,
          weatherGuaranteeId: acceptedQuote?.id ? acceptedQuote?.id : "",
          weatherGuaranteeAmount: acceptedQuote?.price_charged ? acceptedQuote?.price_charged * 100 : 0,
        });

        console.log(`Getting slot IDs for booking.`);

        //create bookings according to slot in bookingslot tables
        const slots =
          (await provider?.getSlotIdsForBooking(
            bookingId,
            courseMembershipId ? Number(playerCountForMemberShip) : booking.playerCount ?? 0,
            userId,
            booking.providerBookingId,
            provider.providerId,
            existingTeeTime.courseId,
            booking.providerBookingSlotIds,
            providerCourseMembershipId
          )) ?? [];
        bookingSlots = [...bookingSlots, ...slots];

        console.log(`Looping through and updating the booking slots.`);
        if (provider?.requireToCreatePlayerSlots()) {
          for (let i = 0; i < slots.length; i++) {
            //TODO: Why can't we use if( i === 0 ) { continue; }? Would it be cleaner?
            if (i != 0) {
              await provider?.updateTeeTime(
                token ?? "",
                teeTime?.providerCourseId ?? "",
                teeTime?.providerTeeSheetId ?? "",
                booking.providerBookingId,
                {
                  data: {
                    type: "Guest",
                    id: booking.providerBookingId,
                    attributes: {
                      type: "Guest",
                      name: "Guest",
                      paid: false,
                      cartPaid: false,
                      noShow: false,
                    },
                  },
                },
                bookingSlots[i]?.slotnumber
              );
            }
          }
        }
        teeTimesToUpdate.push({
          id: teeTimeData.id,
          availableSecondHandSpots: teeTimeData.availableSecondHandSpots + booking.playerCount,
          availableFirstHandSpots: teeTimeData.availableFirstHandSpots - booking.playerCount,
        });
        remainingAmount = remainingAmount - totalAmountForBooking;
        teeTimeDistributionOnGroupBooking.push({
          time: teeTimeData.providerDate,
          player: booking.playerCount
        })
      }
    } else {
      bookingsToCreate.push({
        id: bookingId,
        // purchasedAt: currentUtcTimestamp(),
        // time: existingTeeTime.date,
        providerBookingId: providerBookingId,
        // withCart: withCart,
        isListed: false,
        numberOfHoles: existingTeeTime.numberOfHoles,
        minimumOfferPrice: 0,
        ownerId: userId,
        // courseId: existingTeeTime.courseId,
        teeTimeId: existingTeeTime.id,
        nameOnBooking: existingTeeTime.customerName ?? "Guest",
        includesCart: withCart,
        listId: null,
        // entityId: existingTeeTime.entityId,
        cartId: normalizedCartData.cartId,
        playerCount: courseMembershipId ? Number(playerCountForMemberShip) : players ?? 0,
        greenFeePerPlayer:
          (isFirstHandBooking
            ? existingTeeTime.greenFee + normalizedCartData.advancedBookingAmount * 100
            : purchasePrice) || 0,
        totalTaxesAmount: additionalTaxes.additionalTaxes * 100, // normalizedCartData.taxCharge * 100 || 0,
        charityId: normalizedCartData.charityId || null,
        totalCharityAmount: normalizedCartData.charityCharge * 100 || 0,
        totalAmount: Math.ceil((normalizedCartData.total || 0) + additionalTaxes.additionalTaxes * 100),
        providerPaymentId: paymentId,
        weatherQuoteId: normalizedCartData.weatherQuoteId ?? null,
        weatherGuaranteeId: acceptedQuote?.id ? acceptedQuote?.id : null,
        weatherGuaranteeAmount: acceptedQuote?.price_charged ? acceptedQuote?.price_charged * 100 : 0,
        markupFees: (normalizedCartData?.markupCharge ?? 0) * 100,
        cartFeePerPlayer: cartFeeCharge,
        totalGreenFeeTaxAmount: additionalTaxes.greenFeeTaxTotal * 100,
        totalCartFeeTaxAmount: additionalTaxes.cartFeeTaxPercentTotal * 100,
        totalWeatherGuaranteeTaxAmount: additionalTaxes.weatherGuaranteeTaxTotal * 100,
        totalMarkupFeeTaxAmount: additionalTaxes.markupTaxTotal * 100,
        source: source ? source : null,
        customerComment: additionalNoteFromUser,
        needClubRental: needRentals,
        courseMembershipId: courseMembershipId,
        canResell: courseMembershipId ? 1 : 0,
        totalMerchandiseAmount: normalizedCartData.merchandiseCharge * 100,
        totalMerchandiseTaxAmount: additionalTaxes.merchandiseTaxTotal * 100,
      });
      transfersToCreate.push({
        id: randomUUID(),
        amount: purchasePrice + additionalTaxes.additionalTaxes * 100,
        purchasedPrice: purchasePrice,
        bookingId: bookingId,
        transactionId: transactionId,
        fromUserId: "0x000", //first hand sales are from the platform
        toUserId: userId,
        courseId: existingTeeTime.courseId,
        weatherGuaranteeId: acceptedQuote?.id ? acceptedQuote?.id : "",
        weatherGuaranteeAmount: acceptedQuote?.price_charged ? acceptedQuote?.price_charged * 100 : 0,
      });

      console.log(`Getting slot IDs for booking.`);

      //create bookings according to slot in bookingslot tables
      const slots =
        (await provider?.getSlotIdsForBooking(
          bookingId,
          courseMembershipId ? Number(playerCountForMemberShip) : players ?? 0,
          userId,
          providerBookingId,
          provider.providerId,
          existingTeeTime.courseId,
          providerBookingIds,
          providerCourseMembershipId
        )) ?? [];
      bookingSlots = [...bookingSlots, ...slots];

      console.log(`Looping through and updating the booking slots.`);
      if (provider?.requireToCreatePlayerSlots()) {
        for (let i = 0; i < bookingSlots.length; i++) {
          //TODO: Why can't we use if( i === 0 ) { continue; }? Would it be cleaner?
          if (i != 0) {
            await provider?.updateTeeTime(
              token ?? "",
              teeTime?.providerCourseId ?? "",
              teeTime?.providerTeeSheetId ?? "",
              providerBookingId,
              {
                data: {
                  type: "Guest",
                  id: providerBookingId,
                  attributes: {
                    type: "Guest",
                    name: "Guest",
                    paid: false,
                    cartPaid: false,
                    noShow: false,
                  },
                },
              },
              bookingSlots[i]?.slotnumber
            );
          }
        }
      }
    }

    console.log(`Creating bookings and slots in database.`);
    //create all booking in a transaction to ensure atomicity
    await this.database.transaction(async (tx) => {
      if (isFirstHandGroupBooking) {
        await tx
          .insert(groupBookings)
          .values({
            id: groupId as string,
            name: existingTeeTime.customerName ?? "Guest",
            courseId: existingTeeTime.courseId,
            providerPaymentId: paymentId,
          })
          .execute()
          .catch((err) => {
            this.logger.error(err);
            loggerService.errorLog({
              userId: userId,
              url: `/TokenizeService/tokenizeBooking`,
              userAgent: "",
              message: "ERROR_CREATING_GROUP_BOOKING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                groupId,
                existingTeeTime,
                paymentId,
                providerBookings,
              }),
            });
            tx.rollback();
          });
      }

      //create each booking
      await tx
        .insert(bookings)
        .values(bookingsToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: userId,
            url: `/TokenizeService/tokenizeBooking`,
            userAgent: "",
            message: "ERROR_CREATING_BOOKING",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              bookingsToCreate,
              providerTeeTimeId,
              providerBookingId,
            }),
          });
          tx.rollback();
        });
      await tx
        .insert(bookingslots)
        .values(bookingSlots)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: userId,
            url: `/TokenizeService/tokenizeBooking`,
            userAgent: "",
            message: "ERROR_CREATING_BOOKING_SLOTS",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              bookingSlots,
              providerTeeTimeId,
              providerBookingId,
            }),
          });
          tx.rollback();
        });
      if (!isWebhookAvailable) {
        if (isFirstHandGroupBooking) {
          for (const teeTime of teeTimesToUpdate) {
            await tx
              .update(teeTimes)
              .set({
                availableSecondHandSpots: teeTime.availableSecondHandSpots,
                availableFirstHandSpots: teeTime.availableFirstHandSpots,
              })
              .where(eq(teeTimes.id, teeTime.id))
              .execute();
          }
        } else {
          await tx
            .update(teeTimes)
            .set({
              availableSecondHandSpots: existingTeeTime.availableSecondHandSpots + players,
              availableFirstHandSpots: existingTeeTime.availableFirstHandSpots - players,
            })
            .where(eq(teeTimes.id, existingTeeTime.id))
            .execute();
        }
      }

      await tx
        .insert(transfers)
        .values(transfersToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: userId,
            url: `/TokenizeService/tokenizeBooking`,
            userAgent: "",
            message: "ERROR_CREATING_TRANSFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              providerTeeTimeId,
              providerBookingId,
              transfersToCreate,
            }),
          });
          tx.rollback();
        });

      // merchandise transactions
      if (purchasedMerchandise?.length > 0 && merchandiseItemsToUpdate.length > 0) {
        console.log("purchasedMerchandise", purchasedMerchandise);
        console.log("merchandiseItemsToUpdate", merchandiseItemsToUpdate);
        await tx
          .insert(bookingMerchandise)
          .values(merchandiseEntriesToCreate)
          .execute()
          .catch((err) => {
            this.logger.error(err);
            void loggerService.errorLog({
              userId: userId,
              url: `/TokenizeService/tokenizeBooking`,
              userAgent: "",
              message: "ERROR_CREATING_BOOKING_MERCHANDISE",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                providerTeeTimeId,
                providerBookingId,
                merchandiseEntriesToCreate,
              }),
            });
          });
        await Promise.all(
          merchandiseItemsToUpdate.map(async (merchandiseItem) => {
            await tx
              .update(courseMerchandise)
              .set(merchandiseItem)
              .where(eq(courseMerchandise.id, merchandiseItem.id))
              .execute();
          })
        );
      }
    });

    void loggerService.auditLog({
      id: randomUUID(),
      userId,
      teeTimeId: existingTeeTime?.id,
      bookingId,
      listingId: "",
      courseId: existingTeeTime.courseId,
      eventId: "TEE_TIME_PURCHASED",
      json: "Tee time purchased",
    });
    let validForCollectPayment = false;

    if (players > 1) {
      validForCollectPayment = true;
    } else {
      validForCollectPayment = false;
    }

    const collectPaymentUrl = `http://localhost:3000/${existingTeeTime.courseId}/my-tee-box/?bookingId=${bookingId}&collectPayment=${validForCollectPayment}`;
    const finalAmount =
      Math.floor(purchasePrice + (cartFeeCharge ?? 0)) * Number(players) +
      (normalizedCartData?.markupCharge ?? 0) * 100 +
      additionalTaxes.additionalTaxes;
    const message = `
${players} tee times have been purchased for ${existingTeeTime.date} at ${existingTeeTime.courseId}
    price per booking: ${finalAmount} 

    ${providerBookingId}

    This is a first party purchase from the course

    you can now collect the payment ${collectPaymentUrl}
    `;
    let event: Event, template;
    if (isFirstHandGroupBooking) {
      const playerDistributionParts = teeTimeDistributionOnGroupBooking.map((teeTime) => {
        return `${formatTimeWithoutDate(teeTime.time, true, existingTeeTime.timezoneCorrection ?? 0)
          } (${teeTime.player})`.replace(/ /g, "\u00A0")
      })
      const playerDistribution = playerDistributionParts.join(" • ");
      event = {
        startDate: existingTeeTime.date,
        endDate: existingTeeTime.date,
        email: existingTeeTime.email ?? "",
        address: existingTeeTime.address,
        name: existingTeeTime.name,
        reservationGroupId: groupId,
        numberOfPlayer: players.toString(),
        playTime: this.extractTime(
          formatTime(existingTeeTime.providerDate, true, existingTeeTime.timezoneCorrection ?? 0)
        ),
      };

      template = {
        CustomerFirstName: existingTeeTime.customerName?.split(" ")[0],
        CourseName: existingTeeTime.courseName ?? "-",
        FacilityName: existingTeeTime.entityName ?? "-",
        PlayDateTime: formatTime(existingTeeTime.providerDate, true, existingTeeTime.timezoneCorrection ?? 0),
        NumberOfHoles: existingTeeTime.numberOfHoles,
        SensibleWeatherIncluded: normalizedCartData.sensibleCharge ? "Yes" : "No",
        PurchasedFrom: existingTeeTime.courseName ?? "-",
        PlayerCount: players ?? 0,
        TotalAmount: formatMoney(normalizedCartData.total / 100 + additionalTaxes.additionalTaxes),
        CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
        CourseURL: existingTeeTime?.websiteURL ?? "",
        HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
        SellTeeTImeURL: `${redirectHref}/my-tee-box`,
        ManageTeeTimesURL: `${redirectHref}/my-tee-box`,
        GroupReservationID: groupId,
        MyTeeBoxCollectPaymentUrl: `${redirectHref}/my-tee-box/?bookingId=${bookingId}&collectPayment=${validForCollectPayment}`,
        PurchasedMerchandise: purchasedMerchandise?.length > 0 ? true : false,
        MerchandiseDetails: merchandiseDetails,
        color1: color1,
        PlayerDistribution: playerDistribution
      };
    } else {
      event = {
        startDate: existingTeeTime.date,
        endDate: existingTeeTime.date,
        email: existingTeeTime.email ?? "",
        address: existingTeeTime.address,
        name: existingTeeTime.name,
        reservationId: bookingId,
        courseReservation: providerBookingId,
        numberOfPlayer: players.toString(),
        playTime: this.extractTime(
          formatTime(existingTeeTime.providerDate, true, existingTeeTime.timezoneCorrection ?? 0)
        ),
      };

      template = {
        CustomerFirstName: existingTeeTime.customerName?.split(" ")[0],
        CourseName: existingTeeTime.courseName ?? "-",
        // GolfDistrictReservationID: bookingsToCreate?.[0]?.id ?? "-",
        CourseReservationID: providerBookingId ?? "-",
        FacilityName: existingTeeTime.entityName ?? "-",
        PlayDateTime: formatTime(existingTeeTime.providerDate, true, existingTeeTime.timezoneCorrection ?? 0),
        NumberOfHoles: existingTeeTime.numberOfHoles,
        GreenFeesPerPlayer:
          `$${(
            (existingTeeTime.greenFee +
              Number(cartFeeCharge) +
              (normalizedCartData?.markupCharge ?? 0) * 100) /
            100 +
            normalizedCartData.advancedBookingAmount
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}` ?? "-",
        GreenFees:
          `$${(
            ((existingTeeTime.greenFee +
              Number(cartFeeCharge) +
              (normalizedCartData?.markupCharge ?? 0) * 100 +
              normalizedCartData.advancedBookingAmount * 100) *
              players) /
            100
          ).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}` ?? "-",
        TaxesAndOtherFees: `$${(normalizedCartData.taxes + additionalTaxes.additionalTaxes).toLocaleString(
          "en-US",
          {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }
        )}`,
        SensibleWeatherIncluded: normalizedCartData.sensibleCharge ? "Yes" : "No",
        PurchasedFrom: existingTeeTime.courseName ?? "-",
        PlayerCount: players ?? 0,
        TotalAmount: formatMoney(normalizedCartData.total / 100 + additionalTaxes.additionalTaxes),
        CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${existingTeeTime?.cdnKey}.${existingTeeTime?.extension}`,
        CourseURL: existingTeeTime?.websiteURL ?? "",
        HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
        // BuyTeeTImeURL: `${redirectHref}`,
        // CashOutURL: `${redirectHref}/account-settings/${userId}`,
        SellTeeTImeURL: `${redirectHref}/my-tee-box`,
        ManageTeeTimesURL: `${redirectHref}/my-tee-box`,
        MyTeeBoxCollectPaymentUrl: `${redirectHref}/my-tee-box/?bookingId=${bookingId}&collectPayment=${validForCollectPayment}`,
        PurchasedMerchandise: purchasedMerchandise?.length > 0 ? true : false,
        MerchandiseDetails: merchandiseDetails,
        color1: color1,
      };
    }

    const icsContent: string = createICS(event);

    console.log(template);

    const sendgridTemplateId = isFirstHandGroupBooking
      ? process.env.SENDGRID_TEE_TIMES_GROUP_PURCHASED_TEMPLATE_ID
      : process.env.SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID;

    let isEmailSend = false;
    try {
      await this.notificationService.createNotification(
        userId,
        "TeeTimes Purchased",
        message,
        existingTeeTime.courseId,
        sendgridTemplateId,
        template,
        [
          {
            content: Buffer.from(icsContent).toString("base64"),
            filename: "meeting.ics",
            type: "text/calendar",
            disposition: "attachment",
            contentId: "meeting",
          },
        ]
      );
    } catch (error: any) {
      console.log(error.message);
      isEmailSend = true;
      this.logger.error(error);
      loggerService.errorLog({
        userId: userId,
        url: "/reserveBooking",
        userAgent: "",
        message: "EMAIL_SEND_FAILED_AFTER_TEETIME_PURCHASE",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          bookingId: bookingId,
          teeTimeID: existingTeeTime.courseId,
        }),
      });
    }
    const bookingIdObject: { bookingId: string; isEmailSend: boolean; validForCollectPayment: boolean } = {
      bookingId: isFirstHandGroupBooking ? bookingIds.toString() : bookingId,
      isEmailSend,
      validForCollectPayment,
    };
    return bookingIdObject;
  }

  extractTime = (dateStr: string) => {
    const timeRegex = /\b\d{1,2}:\d{2} (AM|PM)\b/;
    const timeMatch = dateStr.match(timeRegex);
    return timeMatch ? timeMatch[0] : null;
  };

  /**
   * Transfers a bookings from one user to another.
   * @param userId - The ID of the user initiating the transfer.
   * @param bookingId - array ID of the booking.
   * @param newUserId - The ID of the user to whom the booking is being transferred.
   * @returns A promise that resolves to the updated booking.
   */
  transferBookings = async (userId: string, bookingIds: string[], newOwnerId: string, price: number) => {
    //validate the user owns each booking
    const bookingsToTransfer = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        courseId: teeTimes.courseId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(and(inArray(bookings.id, bookingIds), eq(bookings.ownerId, userId)))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: userId,
          url: `/TokenizeService/transferBookings`,
          userAgent: "",
          message: "ERROR_GETTING_BOOKINGS_TO_TRANSFER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
          }),
        });
        throw new Error(`Error finding bookings with id: ${bookingIds}`);
      });
    if (!bookingsToTransfer) {
      throw new Error("No bookings found to transfer");
    }
    if (bookingsToTransfer.length !== bookingIds.length) {
      throw new Error("Not all bookings found to transfer");
    }
    if (!bookingsToTransfer.every((booking) => booking.ownerId === userId)) {
      throw new Error("Not all bookings found to transfer belong to the user");
    }
    const transactionId = randomUUID();
    //transfer the bookings
    // await this.database.transaction(async (tx) => {
    //   for (const booking of bookingsToTransfer) {
    //     await tx
    //       .update(bookings)
    //       .set({
    //         ownerId: newOwnerId,
    //         nameOnBooking: "Guest",
    //       })
    //       .where(eq(bookings.id, booking.id))
    //       .execute()
    //       .catch((err) => {
    //         this.logger.error(err);
    //         tx.rollback();
    //       });
    //     await tx
    //       .insert(transfers)
    //       .values({
    //         id: randomUUID(),
    //         transactionId: transactionId,
    //         amount: price,
    //         bookingId: booking.id,
    //         fromUserId: userId,
    //         toUserId: newOwnerId,
    //         courseId: booking.courseId??"",
    //         purchasedPrice: price,
    //       })
    //       .execute()
    //       .catch((err) => {
    //         this.logger.error(err);
    //         tx.rollback();
    //       });
    //   }
    // });

    const message1 = `
    ${bookingIds.length} tee times have been transferred to you This is to the new owner of the bookings the provider ids: ${bookingIds}
    `;

    // await this.notificationService.createNotification(
    //   newOwnerId,
    //   "TeeTimes Purchased",
    //   message1,
    //   bookingsToTransfer[0]?.courseId
    // );

    const message2 = `
    ${bookingIds.length} bookings have been purchased this is to the old owner of the bookings
    Transfers bookings:
    `;
    // await this.notificationService.createNotification(
    //   userId,
    //   "TeeTimes Sold",
    //   message2,
    //   bookingsToTransfer[0]?.courseId
    // );
  };

  /**
   * Adds names to owned bookings.
   *
   * @param userId - The ID of the user updating the booking names.
   * @param bookingIds - An array of booking IDs to be updated.
   * @param names - An array of names to be added to the corresponding bookings.
   * @returns A promise that resolves once the names are added to the bookings.
   * @throws Error - Throws an error if there are issues interacting with the data store (Prisma).
   * @example
   * await tokenizeService.addNamesToOwnedBookings("user123", ["booking123", "booking456"], ["John", "Jane"]);
   */
  addNamesToOwnedBookings = async (
    userId: string,
    bookingIds: string[],
    names: { name: string; playerId?: string }[]
  ) => {
    //validate teh user owns each booking
    const data = await this.database
      .select({
        ownerId: bookings.ownerId,
      })
      .from(bookings)
      .where(and(inArray(bookings.id, bookingIds), eq(bookings.ownerId, userId)));
    if (!data) {
      this.logger.warn(`No bookings found to update`);
      throw new Error("No bookings found to update");
    }
    if (data.length !== bookingIds.length) {
      this.logger.warn(`Not all owned by user`);
      throw new Error("Not all bookings found to update");
    }
    const golfDistrictPlayers = names.map((name) => name.playerId);
    //const playerNames
    await this.database
      .transaction(async (tx) => {
        for (let i = 0; i < bookingIds.length; i++) {
          const toUpdate = bookingIds[i]!;
          await tx
            .update(bookings)
            .set({
              nameOnBooking: names[i]?.name,
            })
            .where(eq(bookings.id, toUpdate))
            .execute()
            .catch((err) => {
              this.logger.error(err);
              loggerService.errorLog({
                userId: userId,
                url: `/TokenizeService/addNamesToOwnedBookings`,
                userAgent: "",
                message: "ERROR_ADDING_NAMES_TO_OWNED_BOOKINGS",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingId: bookingIds[i],
                  names,
                }),
              });
              throw new Error(`Error updating booking with id: ${bookingIds[i]}`);
            });
        }
      })
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: userId,
          url: `/TokenizeService/addNamesToOwnedBookings`,
          userAgent: "",
          message: "ERROR_ADDING_NAMES_TO_OWNED_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
            names,
          }),
        });
        throw new Error(`Error updating booking with id: ${bookingIds}`);
      });
  };
}

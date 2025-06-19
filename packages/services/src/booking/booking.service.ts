import { randomUUID } from "crypto";
import { and, asc, desc, eq, gte, inArray, not, or, sql, type Db, isNull, db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
import { courseContacts } from "@golf-district/database/schema/courseContacts";
import { courses } from "@golf-district/database/schema/courses";
import { customerCarts } from "@golf-district/database/schema/customerCart";
import { entities } from "@golf-district/database/schema/entities";
import type { InsertList } from "@golf-district/database/schema/lists";
import { lists } from "@golf-district/database/schema/lists";
import { offers } from "@golf-district/database/schema/offers";
import { providers } from "@golf-district/database/schema/providers";
import { providerCourseLink } from "@golf-district/database/schema/providersCourseLink";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import type { InsertTransfer } from "@golf-district/database/schema/transfers";
import { transfers } from "@golf-district/database/schema/transfers";
import { userBookingOffers } from "@golf-district/database/schema/userBookingOffers";
import { users } from "@golf-district/database/schema/users";
import type { ReserveTeeTimeResponse } from "@golf-district/shared";
import { currentUtcTimestamp, dateToUtcTimestamp, formatMoney, formatTime } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { cacheManager } from "@golf-district/shared/src/utils/cacheManager";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import UTC from "dayjs/plugin/utc";
import { alias } from "drizzle-orm/mysql-core";
import { appSettingService } from "../app-settings/initialized";
import type {
  CustomerCart,
  MerchandiseProduct,
  MerchandiseWithTaxOverride,
  ProductData,
} from "../checkout/types";
import type { NotificationService } from "../notification/notification.service";
import type { HyperSwitchService } from "../payment-processor/hyperswitch.service";
import type { SensibleService } from "../sensible/sensible.service";
import type { Customer, ProviderService } from "../tee-sheet-provider/providers.service";
import type { BookingDetails, BookingResponse, ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import type { TeeTimeResponse as ForeupTeeTimeResponse } from "../tee-sheet-provider/sheet-providers/types/foreup.type";
import type { MerchandiseItem, TokenizeService } from "../token/tokenize.service";
import type { UserWaitlistService } from "../user-waitlist/userWaitlist.service";
import { loggerService } from "../webhooks/logging.service";
import { groupBookings } from "@golf-district/database/schema/groupBooking";
import { CacheService } from "../infura/cache.service";
import { bookingSplitPayment } from "@golf-district/database/schema/bookingSplitPayment";
import { courseMerchandise } from "@golf-district/database/schema/courseMerchandise";

dayjs.extend(UTC);
dayjs.extend(timezone);

interface TeeTimeData {
  courseId: string;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  golfers: string[];
  bookingIds: string[];
  purchasedFor: number | null;
  status: string;
  listingId: string | null;
  listedSpots: string[] | null;
  offers: number;
  listPrice: number | null;
  minimumOfferPrice: number;
}

type InviteFriend = {
  id: string;
  handle: string | null;
  name: string | null;
  email: string | null;
  bookingId?: string | null;
  slotId: string;
};

type SlotsData = {
  slotId: string;
  customerId: string;
  name: string | null;
};

interface OwnedTeeTimeData {
  courseId: string;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  golfers: InviteFriend[];
  bookingIds: string[];
  slotsData?: SlotsData[];
  purchasedFor: number | null;
  status: string;
  listingId: string | null;
  listedSpots: string[] | null;
  offers: number;
  listPrice: number | null;
  minimumOfferPrice: number;
  weatherGuaranteeAmount: number | null;
  teeTimeId: string;
  slots: number;
  bookingStatus: string;
  isGroupBooking: boolean;
  groupId: string;
  allowSplit?: boolean | null;
  totalMerchandiseAmount: number;
}

interface ListingData {
  courseId: string;
  listingId: string | null;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  miniumOfferPrice: number;
  listPrice: number | null;
  status: string;
  listedSpots: string[] | null;
  listedSlotsCount: number;
  groupId: string | null;
  weatherGuaranteeAmount?: number;
  isGroupBooking?: boolean;
  playerCount: number;
  listingIdFromRedis?: string | null;
  allowSplit: boolean;
  totalMerchandiseAmount: number;
}

interface TransferData {
  courseId: string;
  courseName: string;
  courseLogo: string;
  date: string;
  firstHandPrice: number;
  pricePerGolfer: number[];
  golfers: InviteFriend[];
  bookingIds: string[];
  status: string;
  playerCount?: number;
  sellerServiceFee: number;
  receiveAfterSale: number;
  weatherGuaranteeId: string;
  weatherGuaranteeAmount: number;
  markupFees?: number | null;
  splitPaymentsAmount?: number | null;
  isPaidSplitAmount?: number | null;
}
type RequestOptions = {
  method: string;
  headers: Headers;
  body: string;
  redirect: RequestRedirect;
};

export type ProviderBooking = {
  providerBookingId: string;
  providerBookingSlotIds: string[];
  playerCount: number;
  teeTimeId: string;
};
/**
 * Service for managing bookings and transaction history.
 */
export class BookingService {
  private logger = Logger(BookingService.name);
  private cacheService: CacheService;
  /**
   * Constructor for BookingService.
   * @param {Db} database - The database instance.
   * @param {string} hyperSwitchApiKey - The API key for HyperSwitchService.
   * @example
   * // Example usage:
   * const bookingService = new BookingService(dbInstance, "yourHyperSwitchApiKey");
   */
  constructor(
    private readonly database: Db,
    private readonly tokenizeService: TokenizeService,
    private readonly providerService: ProviderService,
    private readonly notificationService: NotificationService,
    private readonly hyperSwitchService: HyperSwitchService,
    private readonly sensibleService: SensibleService,
    private readonly userWaitlistService: UserWaitlistService
  ) {
    this.cacheService = new CacheService(process.env.REDIS_URL!, process.env.REDIS_TOKEN!);
  }

  createCounterOffer = async (userId: string, bookingIds: string[], offerId: string, amount: number) => {
    //find owner of each booking
    const bookingOwners = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
      })
      .from(bookings)
      .where(inArray(bookings.id, bookingIds))
      .execute()
      .catch((err) => {
        this.logger.error(
          `Error retrieving bookings for user ${userId} and booking ids ${JSON.stringify(
            bookingIds
          )} and offer id ${offerId} and amount ${amount}: ${err}`
        );
        loggerService.errorLog({
          userId,
          url: "/createCounterOffer",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: `Error retrieving bookings for user ${userId} and booking ids ${JSON.stringify(
            bookingIds
          )} and offer id ${offerId} and amount ${amount}`,
        });
        throw new Error("Error retrieving bookings");
      });
    if (!bookingOwners.length) {
      this.logger.warn(
        `No bookings found for user ${userId} and booking ids ${JSON.stringify(
          bookingIds
        )} and offer id ${offerId} and amount ${amount}`
      );
      loggerService.errorLog({
        userId,
        url: "/createCounterOffer",
        userAgent: "",
        message: "NO_BOOKINGS_FOUND",
        stackTrace: "",
        additionalDetailsJSON: `No bookings found for user ${userId} and booking ids ${JSON.stringify(
          bookingIds
        )} and offer id ${offerId} and amount ${amount}`,
      });
      throw new Error("No bookings found.");
    }
    //check that all bookings are owned by the same user
    const ownerIds = new Set(bookingOwners.map((booking) => booking.ownerId));
    if (ownerIds.size > 1) {
      this.logger.warn(
        `Bookings are not owned by the same user for user ${userId} and booking ids ${JSON.stringify(
          bookingIds
        )} and offer id ${offerId} and amount ${amount}`
      );
      loggerService.errorLog({
        userId,
        url: "/createCounterOffer",
        userAgent: "",
        message: "BOOKINGS_ARE_NOT_OWNED_BY_THE_SAME_USER",
        stackTrace: "",
        additionalDetailsJSON: `Bookings are not owned by the same user for user ${userId} and booking ids ${JSON.stringify(
          bookingIds
        )} and offer id ${offerId} and amount ${amount}`,
      });
      throw new Error("Bookings are not owned by the same user.");
    }
    //two cases if the user is the owner of the bookings
  };

  /**
   * Get transaction history for a user and course.
   * @param {string} userId - The ID of the user.
   * @param {string} courseId - The ID of the course.
   * @param {number} [limit=10] - The maximum number of records to return.
   * @param {string | undefined} cursor - The cursor for pagination.
   * @returns {Promise<Record<string, TransferData>>} - The transaction history data.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const courseId = "course456";
   * const limit = 10;
   * const cursor = "abc";
   * const transactionHistory = await bookingService.getTransactionHistory(userId, courseId, limit, cursor);
   */
  getTransactionHistory = async (
    userId: string,
    courseId: string,
    _limit = 10,
    _cursor: string | undefined
  ) => {
    const data = await this.database
      .select({
        transferId: transfers.id,
        teeTimeId: bookings.teeTimeId,
        date: teeTimes.providerDate,
        courseId: teeTimes.courseId,
        courseName: courses.name,
        sellerFee: courses.sellerFee,
        buyerFee: courses.buyerFee,
        greenFee: bookings.greenFeePerPlayer,
        teeTimeImage: {
          key: assets.key,
          extension: assets.extension,
        },
        listing: lists.id,
        players: bookings.playerCount,
        bookingId: bookings.id,
        amount: transfers.amount,
        purchasedPrice: bookings.totalAmount,
        from: transfers.fromUserId,
        transfersDate: transfers.createdAt,
        weatherGuaranteeId: transfers.weatherGuaranteeId,
        weatherGuaranteeAmount: transfers.weatherGuaranteeAmount,
        cartFee: bookings.cartFeePerPlayer,
        markupFees: bookings.markupFees,
        splitPaymentsAmount: bookingSplitPayment.payoutAmount,
        isPaidSplitAmount: bookingSplitPayment.isPaid,
      })
      .from(transfers)
      .innerJoin(bookings, eq(bookings.id, transfers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(lists, eq(bookings.listId, lists.id))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(bookingSplitPayment, eq(bookingSplitPayment.bookingId, transfers.bookingId))
      // .leftJoin(userBookingOffers, eq(userBookingOffers.bookingId, bookings.id))
      .where(
        and(
          not(eq(bookings.providerBookingId, "")),
          eq(transfers.courseId, courseId),
          or(eq(transfers.toUserId, userId), eq(transfers.fromUserId, userId))
        )
      )
      .orderBy(desc(transfers.createdAt))
      .execute();

    // const [cartData] = await this.database.select({
    //   cart: customerCarts.cart
    // })
    //   .from(customerCarts)
    //   .innerJoin(bookings, eq(bookings.id, transfers.bookingId))
    //   .where(and(eq(customerCarts.teeTimeId, bookings.teeTimeId), eq(customerCarts.userId, userId)))
    //   .execute();
    // console.log("🚀 ~ BookingService ~ cartData:", cartData)

    if (!data.length) {
      this.logger.info(`No tee times found for user: ${userId}`);
      return [];
    }
    const combinedData: Record<string, TransferData> = {};
    data.forEach((teeTime) => {
      if (!combinedData[teeTime.transferId]) {
        let sellerServiceFee = 0;
        let receiveAfterSaleAmount = 0;

        if (teeTime.from === userId) {
          // calculating service fee for sold tee time
          const listingSellerFeePercentage = (teeTime.sellerFee ?? 1) / 100;
          const listingBuyerFeePercentage = (teeTime.buyerFee ?? 1) / 100;
          const listingPrice = teeTime.amount / 100;

          const sellerListingPricePerGolfer = parseFloat(listingPrice.toString());

          const buyerListingPricePerGolfer = sellerListingPricePerGolfer * (1 + listingBuyerFeePercentage);
          const sellerFeePerGolfer = sellerListingPricePerGolfer * listingSellerFeePercentage;
          const buyerFeePerGolfer = sellerListingPricePerGolfer * listingBuyerFeePercentage;
          let totalPayoutForAllGolfers =
            (buyerListingPricePerGolfer - buyerFeePerGolfer - sellerFeePerGolfer) * teeTime.players;

          totalPayoutForAllGolfers = totalPayoutForAllGolfers <= 0 ? 0 : totalPayoutForAllGolfers;

          sellerServiceFee = sellerFeePerGolfer * teeTime.players;

          receiveAfterSaleAmount = Math.abs(totalPayoutForAllGolfers);
        }

        combinedData[teeTime.transferId] = {
          courseId,
          courseName: teeTime.courseName,
          courseLogo: teeTime.teeTimeImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.teeTimeImage.key}.${teeTime.teeTimeImage.extension}`
            : "/defaults/default-course.webp",
          date: teeTime.date ? teeTime.date : "",
          firstHandPrice: teeTime.from === userId ? teeTime.amount / 100 : teeTime.greenFee + teeTime.cartFee,
          golfers: [{ id: "", email: "", handle: "", name: "", slotId: "" }],
          pricePerGolfer:
            teeTime.from === userId
              ? [(teeTime.greenFee * teeTime.players) / 100]
              : [teeTime.purchasedPrice / 100],
          bookingIds: [teeTime.bookingId],
          status: teeTime.from === userId ? "SOLD" : "PURCHASED",
          playerCount: teeTime.players,
          sellerServiceFee: teeTime.from === userId ? sellerServiceFee : 0,
          receiveAfterSale: teeTime.from === userId ? receiveAfterSaleAmount : 0,
          weatherGuaranteeAmount: teeTime.weatherGuaranteeAmount ?? 0,
          weatherGuaranteeId: teeTime.weatherGuaranteeId ?? "",
          markupFees: teeTime.markupFees,
          splitPaymentsAmount: teeTime.splitPaymentsAmount ?? 0,
          isPaidSplitAmount: teeTime.isPaidSplitAmount,
        };
      } else {
        const currentEntry = combinedData[teeTime.transferId];
        if (currentEntry) {
          currentEntry.golfers.push({ id: "", email: "", handle: "", name: "", slotId: "" });
          currentEntry.pricePerGolfer.push(teeTime.from === userId ? teeTime.amount : teeTime.purchasedPrice);
          currentEntry.bookingIds.push(teeTime.bookingId);
        }
      }
    });
    return combinedData;
  };

  /**
   * Get tee times listed by the user for a specific course.
   * @param {string} userId - The ID of the user.
   * @param {string} courseId - The ID of the course.
   * @param {number} [limit=10] - The maximum number of records to return.
   * @param {string | undefined} cursor - The cursor for pagination.
   * @returns {Promise<Record<string, ListingData>>} - The tee times listed by the user.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const courseId = "course456";
   * const limit = 10;
   * const listedTeeTimes = await bookingService.getMyListedTeeTimes(userId, courseId, limit);
   */
  getMyListedTeeTimes = async (userId: string, courseId: string, _limit = 10, _cursor?: string) => {
    const localDateTimePlus1Hour = dayjs.utc().utcOffset(-7).add(1, "hour");

    const data = await this.database
      .select({
        bookingId: bookings.id,
        courseName: courses.name,
        date: teeTimes.providerDate,
        teeTimeImage: {
          key: assets.key,
          extension: assets.extension,
        },
        listingId: bookings.listId,
        teeTimesId: teeTimes.id,
        listPrice: lists.listPrice,
        listedSlots: lists.slots,
        greenFeePerPlayer: teeTimes.greenFeePerPlayer,
        minimumOfferPrice: bookings.minimumOfferPrice,
        groupId: bookings.groupId,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        playerCount: bookings.playerCount,
        allowSplit: lists.allowSplit,
        totalMerchandiseAmount: bookings.totalMerchandiseAmount,
      })
      .from(bookings)
      .innerJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .innerJoin(assets, eq(assets.id, courses.logoId))
      .innerJoin(lists, and(eq(lists.id, bookings.listId), eq(lists.isDeleted, false)))
      .where(
        and(
          eq(bookings.isListed, true),
          eq(teeTimes.courseId, courseId),
          eq(bookings.ownerId, userId),
          gte(teeTimes.providerDate, localDateTimePlus1Hour.format("YYYY-MM-DDTHH:mm:ss")) //Exclude past tee times
        )
      )
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving tee times: ${err}`);
        loggerService.errorLog({
          userId,
          url: "/getMyListedTeeTimes",
          userAgent: "",
          message: "ERROR_RETRIEVING_TEE_TIMES",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: `Error retrieving tee times: ${userId} and courseId ${courseId}`,
        });
        throw new Error("Error retrieving tee times");
      });
    const combinedData: Record<string, ListingData> = {};
    for (const teeTime of data) {
      if (teeTime.teeTimesId) {
        if (!combinedData[teeTime.teeTimesId]) {
          const value = await this.cacheService?.getCache(`listing_id_${teeTime.listingId}`);
          let listingIdFromRedis;
          if (value) {
            const { listingId } = JSON.parse(value as string);
            if (listingId) {
              listingIdFromRedis = listingId;
            }
          }

          console.log("Retrieved listingId from Redis Cache: ", listingIdFromRedis);
          combinedData[teeTime.teeTimesId] = {
            courseId,
            listingId: teeTime.listingId,
            courseName: teeTime.courseName ? teeTime.courseName : "",
            courseLogo: teeTime.teeTimeImage
              ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.teeTimeImage.key}.${teeTime.teeTimeImage.extension}`
              : "/defaults/default-course.webp",
            date: teeTime.date ? teeTime.date : "",
            firstHandPrice: teeTime.greenFeePerPlayer ? teeTime.greenFeePerPlayer : 0,
            miniumOfferPrice: teeTime.minimumOfferPrice ? teeTime.minimumOfferPrice : 0,
            listPrice: teeTime.listPrice / 100,
            status: "LISTED",
            listedSpots: [teeTime.bookingId],
            listedSlotsCount: teeTime.listedSlots,
            groupId: teeTime.groupId ?? "",
            weatherGuaranteeAmount: teeTime.weatherGuaranteeAmount ?? 0,
            isGroupBooking: false,
            playerCount: teeTime.playerCount,
            listingIdFromRedis: listingIdFromRedis as string | null | undefined,
            allowSplit: teeTime.allowSplit,
            totalMerchandiseAmount: teeTime.totalMerchandiseAmount ?? 0,
          };
        } else {
          const currentEntry = combinedData[teeTime.teeTimesId];
          if (currentEntry) {
            currentEntry.listedSlotsCount = teeTime.listedSlots;
            if (currentEntry.listedSpots) {
              currentEntry.listedSpots.push(teeTime.bookingId);
            } else {
              currentEntry.listedSpots = [teeTime.bookingId];
            }
          }
        }
      }
    }
    return combinedData;
  };
  /**
   * Get the purchase history for a specific tee time.
   * @param {string} teeTimeId - The ID of the tee time.
   * @returns {Promise<HistoryData[]>} - The purchase history for the tee time.
   * @example
   * // Example usage:
   * const teeTimeId = "teeTime789";
   * const teeTimeHistory = await bookingService.getTeeTimeHistory(teeTimeId);
   */
  getTeeTimeHistory = async (teeTimeId: string) => {
    const data = await this.database
      .select({
        bookingId: bookings.id,
        courseId: teeTimes.courseId,
        purchasedById: transfers.fromUserId,
        purchasedByName: users.name,
        purchaseAmount: transfers.amount,
        purchasedAt: transfers.createdAt,
        purchasedByImage: {
          key: assets.key,
          extension: assets.extension,
        },
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(eq(bookings.teeTimeId, teeTimeId))
      .innerJoin(transfers, eq(transfers.bookingId, bookings.id))
      .innerJoin(users, eq(users.id, transfers.toUserId))
      .leftJoin(assets, eq(assets.id, users.image))
      //.groupBy(bookings.teeTimeId)
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving tee time history: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/getTeeTimeHistory",
          userAgent: "",
          message: "ERROR_RETRIEVING_TEE_TIME_HISTORY",
          stackTrace: "",
          additionalDetailsJSON: "Error retrieving tee time history",
        });
        throw new Error("Error retrieving tee time history");
      });
    if (!data.length) {
      this.logger.info(`No history found for tee time: ${teeTimeId}`);
      return [];
    }
    //map the data to a new obj before
    const res = data.map((booking) => {
      return {
        courseId: booking.courseId,
        bookingId: booking.bookingId,
        purchasedById: booking.purchasedById,
        purchasedByName: booking.purchasedByName,
        purchaseAmount: booking.purchaseAmount,
        purchasedAt: booking.purchasedAt,
        purchasedByImage: booking.purchasedByImage
          ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${booking.purchasedByImage.key}.${booking.purchasedByImage.extension}`
          : "/defaults/default-profile.webp",
      };
    });
    return res;
  };

  /**
   * Get the IDs of bookings owned by a user for a specific tee time.
   * @param {string} userId - The ID of the user.
   * @param {string} teeTimeId - The ID of the tee time.
   * @returns {Promise<string[]>} - The IDs of owned bookings.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const teeTimeId = "teeTime789";
   * const ownedBookings = await bookingService.getOwnedBookingsForTeeTime(userId, teeTimeId);
   */
  getOwnedBookingsForTeeTime = async (userId: string, teeTimeId: string) => {
    const data = await this.database
      .select({
        id: bookings.id,
      })
      .from(bookings)
      .where(and(eq(bookings.ownerId, userId), eq(bookings.teeTimeId, teeTimeId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          applicationName: "golfdistrict-foreup",
          clientIP: "",
          userId,
          url: "/getOwnedBookingsForTeeTime",
          userAgent: "",
          message: "ERROR_GETTING_OWNED_BOOKING",
          stackTrace: "",
          additionalDetailsJSON: "error getting owned booking",
        });
        throw new Error("Error retrieving bookings");
      });
    if (!data.length) {
      return [];
    }
    return data.map((booking) => booking.id);
  };

  getOwnedTeeTimes = async (userId: string, courseId: string, _limit = 10, _cursor: string | undefined) => {
    const courseTimezoneISO = await this.database
      .select({
        timezoneISO: courses.timezoneISO,
      })
      .from(courses)
      .where(and(eq(courses.id, courseId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error getting course by ID: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/getOwnedTeeTimes",
          userAgent: "",
          message: "ERROR_GETTING_COURSE_BY_ID",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error getting course");
      });

    const timezoneOffset = courseTimezoneISO[0]?.timezoneISO ?? "America/Los_Angeles";
    let nowInCourseTimezone = dayjs().utc().tz(timezoneOffset).format("YYYY-MM-DDTHH:mm:ss");
    const currentTime = dayjs(new Date()).format("YYYY-MM-DDTHH:mm:ss");

    // compare nowInCourseTimezone with currentTime
    if (dayjs(nowInCourseTimezone).isBefore(currentTime)) {
      // If nowInCourseTimezone is before currentTime, set it to currentTime
      nowInCourseTimezone = currentTime;
    } else {
      // If nowInCourseTimezone is after currentTime, keep it as is
      nowInCourseTimezone = dayjs().utc().tz(timezoneOffset).format("YYYY-MM-DDTHH:mm:ss");
    }

    console.log("nowInCourseTimezone-----currentTime----->", nowInCourseTimezone);

    const data = await this.database
      .select({
        id: teeTimes.id,
        date: teeTimes.providerDate,
        courseId: teeTimes.courseId,
        courseName: courses.name,
        courseMarkup: courses.markupFeesFixedPerPlayer,
        greenFeePerPlayer: teeTimes.greenFeePerPlayer,
        cartFeePerPlayer: teeTimes.cartFeePerPlayer,
        lastHighestSale: sql<number | null>`MAX(${transfers.amount})`,
        teeTimeImage: {
          key: assets.key,
          extension: assets.extension,
        },
        listing: lists.id,
        listingIsDeleted: lists.isDeleted,
        players: bookings.nameOnBooking,
        bookingId: bookings.id,
        offers: sql<number>`COUNT(DISTINCT${userBookingOffers.offerId})`,
        golferCount: sql<number | null>`COUNT(${bookings.ownerId})`,
        listPrice: lists.listPrice,
        bookingListed: bookings.isListed,
        minimumOfferPrice: bookings.minimumOfferPrice,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        slotId: bookingslots.slotnumber,
        slotCustomerName: bookingslots.name,
        slotCustomerId: bookingslots.customerId,
        slotPosition: bookingslots.slotPosition,
        purchasedFor: bookings.totalAmount,
        providerBookingId: bookings.providerBookingId,
        slots: lists.slots,
        playerCount: bookings.playerCount,
        bookingStatus: bookings.status,
        allowSplit: lists.allowSplit,
        totalMerchandiseAmount: bookings.totalMerchandiseAmount,
      })
      .from(teeTimes)
      .innerJoin(bookings, eq(bookings.teeTimeId, teeTimes.id))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(
        lists,
        and(eq(lists.id, bookings.listId), eq(lists.isDeleted, false), eq(bookings.ownerId, lists.userId))
      )
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(userBookingOffers, eq(userBookingOffers.bookingId, bookings.id))
      .leftJoin(transfers, eq(transfers.bookingId, bookings.id))
      .leftJoin(bookingslots, eq(bookingslots.bookingId, bookings.id))
      .where(
        and(
          not(eq(bookings.providerBookingId, "")),
          eq(bookings.ownerId, userId),
          eq(bookings.isActive, true),
          eq(teeTimes.courseId, courseId),
          gte(teeTimes.providerDate, nowInCourseTimezone),
          or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CONFIRMED")),
          isNull(bookings.groupId)
        )
      )
      .groupBy(
        teeTimes.id,
        teeTimes.date,
        teeTimes.courseId,
        courses.name,
        teeTimes.greenFeePerPlayer,
        assets.key,
        assets.extension,
        bookings.nameOnBooking,
        lists.id,
        bookings.id,
        lists.listPrice,
        bookingslots.slotnumber,
        bookingslots.customerId,
        bookingslots.name,
        bookingslots.slotPosition
      )
      .orderBy(asc(teeTimes.date), asc(bookingslots.slotPosition))
      .execute();
    if (!data.length) {
      this.logger.info(`No tee times found for user: ${userId}`);
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/getOwnedTeeTimes",
        userAgent: "",
        message: "Error_FINDING_TEE_TIME ",
        stackTrace: "",
        additionalDetailsJSON: `No tee times found for user: ${userId}`,
      });
    }
    const combinedData: Record<string, OwnedTeeTimeData> = {};

    data.forEach((teeTime) => {
      if (!combinedData[teeTime.providerBookingId]) {
        const slotData = !teeTime.providerBookingId
          ? Array.from({ length: teeTime.playerCount - 1 }, (_, i) => ({
              name: "",
              slotId: "",
              customerId: "",
            }))
          : [];

        combinedData[teeTime.providerBookingId] = {
          courseId,
          courseName: teeTime.courseName,
          courseLogo: teeTime.teeTimeImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.teeTimeImage.key}.${teeTime.teeTimeImage.extension}`
            : "/defaults/default-course.webp",
          date: teeTime.date,
          firstHandPrice:
            teeTime.greenFeePerPlayer +
            teeTime.cartFeePerPlayer +
            (teeTime.courseMarkup ? teeTime.courseMarkup / 100 : 0),
          golfers: [],
          purchasedFor: Number(teeTime.purchasedFor) / 100,
          bookingIds: [teeTime.bookingId],
          slotsData: [
            {
              name: teeTime.slotCustomerName || "",
              slotId: teeTime.slotId || "",
              customerId: teeTime.slotCustomerId || "",
            },
            ...slotData,
          ],
          status: teeTime.listing && !teeTime.listingIsDeleted ? "LISTED" : "UNLISTED",
          offers: teeTime.offers ? parseInt(teeTime.offers.toString()) : 0,
          listingId: teeTime.listing && !teeTime.listingIsDeleted ? teeTime.listing : null,
          listedSpots: teeTime.listing && !teeTime.listingIsDeleted ? [teeTime.bookingId] : null,
          listPrice: teeTime.listPrice,
          minimumOfferPrice: teeTime.minimumOfferPrice,
          weatherGuaranteeAmount: teeTime.weatherGuaranteeAmount,
          teeTimeId: teeTime.id,
          slots: teeTime.slots || 0,
          bookingStatus: teeTime.bookingStatus,
          isGroupBooking: false,
          groupId: "",
          allowSplit: teeTime.allowSplit,
          totalMerchandiseAmount: teeTime.totalMerchandiseAmount ?? 0,
        };
      } else {
        const currentEntry = combinedData[teeTime.providerBookingId];
        if (currentEntry) {
          currentEntry.bookingIds.push(teeTime.bookingId);
          currentEntry?.slotsData?.push({
            name: teeTime.slotCustomerName,
            customerId: teeTime.slotCustomerId!,
            slotId: teeTime.slotId!,
          });
          if (teeTime.offers) {
            currentEntry.offers = currentEntry.offers
              ? parseInt(currentEntry.offers.toString()) + parseInt(teeTime.offers.toString())
              : 0;
          }
          currentEntry.slots = teeTime.slots || 0;
          if (teeTime.listing && !teeTime.listingIsDeleted) {
            currentEntry.status = "LISTED";
            currentEntry.listingId = teeTime.listing;
            if (teeTime.bookingListed) {
              currentEntry.listedSpots
                ? currentEntry.listedSpots.push(teeTime.bookingId)
                : [teeTime.bookingId];
            }
          }
          // if (
          //   teeTime.lastHighestSale &&
          //   (!currentEntry.purchasedFor || teeTime.lastHighestSale > currentEntry.purchasedFor)
          // ) {
          //   currentEntry.purchasedFor = teeTime.lastHighestSale;
          // }
        }
      }
    });

    for (const t of Object.values(combinedData)) {
      const finaldata: InviteFriend[] = [];

      const slots = t.slotsData ?? [];

      for (const slot of slots) {
        if (slot.customerId !== "") {
          const userData = await this.database
            .select({
              id: users.id,
              handle: users.handle,
              name: users.name,
              email: users.email,
            })
            .from(users)
            .where(eq(users.id, slot.customerId))
            .execute()
            .catch((err) => {
              this.logger.error(`Error retrieving user: ${err}`);
              loggerService.errorLog({
                userId: userId,
                url: "/getOwnedTeeTimes",
                userAgent: "",
                message: "ERROR_RETRIEVING_USER_BY_CUSTOMER_ID",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  courseId,
                  customerId: slot.customerId,
                }),
              });
              throw new Error("Error retrieving user");
            });
          if (userData[0]) {
            const user = userData[0];
            finaldata.push({
              id: user.id,
              handle: user.handle,
              name: user.name || "",
              email: user.email,
              slotId: slot.slotId,
            });
          }
        } else {
          finaldata.push({
            id: "",
            handle: "",
            name: slot.name,
            email: "",
            slotId: slot.slotId,
          });
        }
      }
      // t.slotsData=finaldata;

      // const namesOnBooking = t.golfers.filter((golfer) => golfer !== "Guest");

      // const foundUsersForBooking: {
      //   id: string;
      //   handle: string | null;
      //   name: string | null;
      //   email: string | null;
      // }[] = [];
      // if (namesOnBooking.length > 0) {
      //   for (const _name of namesOnBooking) {
      //     const userData = await this.database
      //       .select({
      //         id: users.id,
      //         handle: users.handle,
      //         name: users.name,
      //         email: users.email,
      //       })
      //       .from(users)
      //       .where(eq(users.name, _name as string))
      //       .execute()
      //       .catch((err) => {
      //         this.logger.error(`Error retrieving user: ${err}`);
      //         throw new Error("Error retrieving user");
      //       });
      //     if (userData[0]) {
      //       foundUsersForBooking.push(userData[0]);
      //     }
      //   }
      // }
      //x will be a string of Guest or a name until its turned into an object here
      // @ts-ignore
      // t.golfers = t.golfers.map((x: string) => {
      //   if (foundUsersForBooking.length > 0) {
      //     const user = foundUsersForBooking.find((user) => x.toLowerCase() === user.name?.toLowerCase());
      //     if (user) {
      //       return {
      //         id: user.id,
      //         handle: user.handle,
      //         name: user.name,
      //         email: user.email,
      //       };
      //     }
      //   }
      //   return {
      //     id: "",
      //     handle: "",
      //     name: x,
      //     email: "",
      //   };
      // });

      t.slotsData = finaldata;
      t.golfers = finaldata;
    }

    const groupTeeTimeData = await this.database
      .select({
        id: teeTimes.id,
        date: teeTimes.providerDate,
        courseId: teeTimes.courseId,
        courseName: courses.name,
        courseMarkup: courses.markupFeesFixedPerPlayer,
        greenFeePerPlayer: teeTimes.greenFeePerPlayer,
        cartFeePerPlayer: teeTimes.cartFeePerPlayer,
        lastHighestSale: sql<number | null>`MAX(${transfers.amount})`,
        teeTimeImage: {
          key: assets.key,
          extension: assets.extension,
        },
        listing: lists.id,
        listingIsListed: groupBookings.isListed,
        players: bookings.nameOnBooking,
        bookingId: bookings.id,
        offers: sql<number>`COUNT(DISTINCT${userBookingOffers.offerId})`,
        golferCount: sql<number | null>`COUNT(${bookings.ownerId})`,
        listPrice: groupBookings.listPricePerGolfer,
        bookingListed: bookings.isListed,
        minimumOfferPrice: bookings.minimumOfferPrice,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        slotId: bookingslots.slotnumber,
        slotCustomerName: bookingslots.name,
        slotCustomerId: bookingslots.customerId,
        slotPosition: bookingslots.slotPosition,
        purchasedFor: bookings.totalAmount,
        providerBookingId: bookings.providerBookingId,
        slots: groupBookings.listSlots,
        playerCount: bookings.playerCount,
        bookingStatus: bookings.status,
        groupId: bookings.groupId,
        totalMerchandiseAmount: bookings.totalMerchandiseAmount,
      })
      .from(teeTimes)
      .innerJoin(bookings, eq(bookings.teeTimeId, teeTimes.id))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(
        lists,
        and(eq(lists.id, bookings.listId), eq(lists.isDeleted, false), eq(bookings.ownerId, lists.userId))
      )
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(userBookingOffers, eq(userBookingOffers.bookingId, bookings.id))
      .leftJoin(transfers, eq(transfers.bookingId, bookings.id))
      .leftJoin(bookingslots, eq(bookingslots.bookingId, bookings.id))
      .innerJoin(groupBookings, eq(groupBookings.id, bookings.groupId))
      .where(
        and(
          not(eq(bookings.providerBookingId, "")),
          eq(bookings.ownerId, userId),
          eq(bookings.isActive, true),
          eq(teeTimes.courseId, courseId),
          gte(teeTimes.providerDate, nowInCourseTimezone),
          or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CONFIRMED")),
          not(isNull(bookings.groupId))
        )
      )
      .groupBy(
        teeTimes.id,
        teeTimes.date,
        teeTimes.courseId,
        courses.name,
        teeTimes.greenFeePerPlayer,
        assets.key,
        assets.extension,
        bookings.nameOnBooking,
        lists.id,
        bookings.id,
        lists.listPrice,
        bookingslots.slotnumber,
        bookingslots.customerId,
        bookingslots.name,
        bookingslots.slotPosition
      )
      .orderBy(asc(teeTimes.date), asc(bookingslots.slotPosition))
      .execute();

    const combinedGroupData: Record<string, OwnedTeeTimeData> = {};

    groupTeeTimeData.forEach((teeTime) => {
      if (!combinedGroupData[teeTime.groupId!]) {
        const slotData = !teeTime.providerBookingId
          ? Array.from({ length: teeTime.playerCount - 1 }, (_, i) => ({
              name: "",
              slotId: "",
              customerId: "",
            }))
          : [];

        combinedGroupData[teeTime.groupId!] = {
          courseId,
          courseName: teeTime.courseName,
          courseLogo: teeTime.teeTimeImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.teeTimeImage.key}.${teeTime.teeTimeImage.extension}`
            : "/defaults/default-course.webp",
          date: teeTime.date,
          firstHandPrice:
            teeTime.greenFeePerPlayer +
            teeTime.cartFeePerPlayer +
            (teeTime.courseMarkup ? teeTime.courseMarkup / 100 : 0),
          golfers: [],
          purchasedFor: Number(teeTime.purchasedFor) / (teeTime.playerCount * 100),
          bookingIds: [teeTime.bookingId],
          slotsData: [
            {
              name: teeTime.slotCustomerName || "",
              slotId: teeTime.slotId || "",
              customerId: teeTime.slotCustomerId || "",
            },
            ...slotData,
          ],
          status: teeTime.listing && teeTime.listingIsListed ? "LISTED" : "UNLISTED",
          offers: teeTime.offers ? parseInt(teeTime.offers.toString()) : 0,
          listingId: teeTime.listing && teeTime.listingIsListed ? teeTime.listing : null,
          listedSpots: teeTime.listing && teeTime.listingIsListed ? [teeTime.bookingId] : null,
          listPrice: teeTime.listPrice,
          minimumOfferPrice: teeTime.minimumOfferPrice,
          weatherGuaranteeAmount: teeTime.weatherGuaranteeAmount,
          teeTimeId: teeTime.id,
          slots: teeTime.slots || 0,
          bookingStatus: teeTime.bookingStatus,
          isGroupBooking: true,
          groupId: teeTime.groupId ?? "",
          totalMerchandiseAmount: teeTime.totalMerchandiseAmount ?? 0,
        };
      } else {
        const currentEntry = combinedGroupData[teeTime.groupId!];
        if (currentEntry) {
          currentEntry.bookingIds.push(teeTime.bookingId);
          currentEntry.slotsData!.push({
            name: teeTime.slotCustomerName,
            customerId: teeTime.slotCustomerId!,
            slotId: teeTime.slotId!,
          });
          if (teeTime.offers) {
            currentEntry.offers = currentEntry.offers
              ? parseInt(currentEntry.offers.toString()) + parseInt(teeTime.offers.toString())
              : 0;
          }
          currentEntry.slots = teeTime.slots || 0;
          if (teeTime.listing && teeTime.listingIsListed) {
            currentEntry.status = "LISTED";
            currentEntry.listingId = teeTime.listing;
            if (teeTime.bookingListed) {
              currentEntry.listedSpots
                ? currentEntry.listedSpots.push(teeTime.bookingId)
                : [teeTime.bookingId];
            }
          }
          currentEntry.purchasedFor =
            (currentEntry.purchasedFor ?? 0) + Number(teeTime.purchasedFor) / (teeTime.playerCount * 100);
        }
      }
    });

    for (const t of Object.values(combinedGroupData)) {
      const finaldata: InviteFriend[] = [];
      if (!t.slotsData) t.slotsData = [];

      for (const slot of t.slotsData) {
        finaldata.push({
          id: "",
          handle: "",
          name: slot.name,
          email: "",
          slotId: slot.slotId,
        });
      }
      t.golfers = finaldata;
    }

    if (!data.length && !groupTeeTimeData.length) return [];

    return { ...combinedData, ...combinedGroupData };
  };

  /**
   * Lists a booking for sale.
   * @todo add validation for max price
   * @param userId - The ID of the user listing the booking.
   * @param listPrice - The price at which the booking is listed.
   * @param bookingIds - IDs of the bookings being listed.
   * @param courseId - ID of the course for the bookings.
   * @param endTime - End time for the booking listing.
   * @returns A promise that resolves when the operation completes.
   * @throws Error - Throws an error if end time is before start time, if the user does not own a tee time, or if other conditions like allowed players are not met.
   */
  createListingForBookings = async (
    userId: string,
    listPrice: number,
    bookingIds: string[],
    endTime: Date,
    slots: number,
    allowSplit?: boolean
  ) => {
    console.warn("bookingIds", bookingIds);
    // console.log("CREATINGLISTING FOR DATE:", dayjs(endTime).utc().format('YYYY-MM-DD'), dayjs(endTime).utc().format('HHmm'));
    if (new Date().getTime() >= endTime.getTime()) {
      this.logger.warn("End time cannot be before current time");
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/createListingForBookings",
        userAgent: "",
        message: "TEE_TIME_LISTED_FAILED",
        stackTrace: "",
        additionalDetailsJSON: "End time cannot be before current time.",
      });
      throw new Error("End time cannot be before current time");
    }

    if (!slots) {
      this.logger.warn(`Slots less than one`);
      throw new Error("Slots less than one");
    }
    if (!bookingIds[0]) {
      this.logger.warn(`No bookings specified.`);
      throw new Error("No bookings specified.");
    }

    const bookingId: string = bookingIds[0];
    const ownedBookings = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
        isListed: bookings.isListed,
        providerDate: teeTimes.providerDate,
        playerCount: bookings.playerCount,
        totalAmount: bookings.totalAmount,
        timezoneCorrection: courses.timezoneCorrection,
        providerBookingId: bookings.providerBookingId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(and(eq(bookings.ownerId, userId), inArray(bookings.id, bookingIds)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
            listPrice,
            endTime,
          }),
        });
        throw new Error("Error retrieving bookings");
      });
    if (!ownedBookings.length) {
      this.logger.warn(`User ${userId} does not own  specified bookings.`);
      throw new Error("User does not  own specified bookings.");
    }
    if (ownedBookings.length > 4) {
      this.logger.warn(`Cannot list more than 4 bookings.`);
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/createListingForBookings",
        userAgent: "",
        message: "TEE_TIME_LISTED_FAILED",
        stackTrace: "",
        additionalDetailsJSON: "Cannot list more than 4 bookings.",
      });
      throw new Error("Cannot list more than 4 bookings.");
    }
    // for (const booking of ownedBookings) {
    //   if (booking.isListed) {
    //     this.logger.warn(`Booking ${booking.id} is already listed.`);
    //     loggerService.errorLog({
    //       applicationName: "golfdistrict-foreup",
    //       clientIP: "",
    //       userId,
    //       url: "/createListingForBookings",
    //       userAgent: "",
    //       message: "TEE_TIME_LISTED_FAILED",
    //       stackTrace: "",
    //       additionalDetailsJSON: "One or more bookings from this tee time is already listed",
    //     });
    //     throw new Error(`One or more bookings from this tee time is already listed.`);
    //   }
    // }
    //validate that all bookings are for the same course
    // const courseIds = new Set(ownedBookings.map((booking) => booking.courseId));
    // if (courseIds.size > 1) {
    //   this.logger.warn(`Bookings are not for the same course.`);
    //   throw new Error("Bookings are not for the same course.");
    // }
    //validate that each booking is for the same tee time
    // const teeTimeIds = new Set(ownedBookings.map((booking) => booking.teeTimeId));
    // if (teeTimeIds.size > 1) {
    //   this.logger.warn(`Bookings are not for the same tee time.`);
    //   throw new Error("Bookings are not for the same tee time.");
    // }

    const [firstBooking] = ownedBookings;
    if (!firstBooking) {
      this.logger.warn(`Booking ${bookingId} not found.`);
      throw new Error(`Booking ${bookingId} not found.`);
    }
    const courseId = firstBooking.courseId ?? "";

    const [course] = await this.database
      .select({
        key: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        name: courses.name,
        id: courses.id,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving course: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error(`Error retrieving course`);
      });

    const toCreate: InsertList = {
      id: randomUUID(),
      userId: userId,
      listPrice: listPrice * 100,
      // teeTimeId: firstBooking?.teeTimeId,
      // endTime: dateToUtcTimestamp(endTime),
      // courseId: courseId,
      // status: "PENDING",
      isDeleted: false,
      // splitTeeTime: false,
      slots,
      allowSplit,
    };
    await this.database
      .transaction(async (transaction) => {
        for (const id of bookingIds) {
          await transaction
            .update(bookings)
            .set({
              isListed: true,
              listId: toCreate.id,
            })
            .where(eq(bookings.id, id))
            .execute()
            .catch((err) => {
              this.logger.error(`Error updating bookingId: ${id}: ${err}`);
              loggerService.errorLog({
                userId: userId,
                url: "/createListingForBookings",
                userAgent: "",
                message: "ERROR_UPDATING_BOOKING_ID",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  courseId,
                  bookingId: id,
                }),
              });
              transaction.rollback();
            });
        }
        //create listing
        await transaction
          .insert(lists)
          .values(toCreate)
          .execute()
          .catch((err) => {
            this.logger.error(`Error creating listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/createListingForBookings",
              userAgent: "",
              message: "ERROR_CREATING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                lists: JSON.stringify(toCreate),
              }),
            });
            transaction.rollback();
          });
      })
      .catch((err) => {
        this.logger.error(`Transaction rolled backError creating listing: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForBookings",
          userAgent: "",
          message: "TRANSACTION_ROLLBACK_ERROR_CREATING_LISTING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            lists: JSON.stringify(toCreate),
          }),
        });
        throw new Error("Error creating listing");
      });

    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Failed to retrieve user: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForBookings",
          userAgent: "",
          message: "FAILED_TO_RETRIEVE_USER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
          }),
        });
        throw new Error("Failed to retrieve user");
      });

    if (!user) {
      this.logger.error(`createNotification: User with ID ${userId} not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createListingForBookings",
        userAgent: "",
        message: "USER_NOT_FOUND",
        stackTrace: `User with ID ${userId} not found.`,
        additionalDetailsJSON: JSON.stringify({
          userId,
        }),
      });
      return;
    }

    if (user.email && user.name) {
      await this.notificationService
        .sendEmailByTemplate(
          user.email,
          "Listing Created",
          process.env.SENDGRID_LISTING_CREATED_TEMPLATE_ID!,
          {
            CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
            CourseURL: course?.websiteURL || "",
            CourseName: course?.name,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            CustomerFirstName: user?.name?.split(" ")[0],
            CourseReservationID: firstBooking?.providerBookingId ?? "-",
            PlayDateTime: formatTime(
              firstBooking.providerDate ?? "",
              true,
              firstBooking.timezoneCorrection ?? 0
            ),
            PlayerCount: slots ?? 0,
            ListedPricePerPlayer: listPrice ? `${listPrice}` : "-",
            TotalAmount: formatMoney(firstBooking.totalAmount / 100 ?? 0),
          },
          []
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/createListingForBookings",
            userAgent: "",
            message: "ERROR_SENDING_EMAIL",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              email: user.email,
              name: user.name,
              courseName: course?.name,
            }),
          });
          throw new Error("Error sending email");
        });
    }

    if (!firstBooking.providerDate) {
      this.logger.error("providerDate not found in booking, Can't send notifications to users");
      loggerService.errorLog({
        userId: userId,
        url: "/createListingForBookings",
        userAgent: "",
        message: "PROVIDER_DATE_NOT_FOUND",
        stackTrace: `providerDate not found in booking, Can't send notifications to users`,
        additionalDetailsJSON: JSON.stringify({
          userId,
        }),
      });
      throw new Error("providerDate not found in booking, Can't send notifications to users");
    }

    const [date, time] = firstBooking.providerDate.split("T");

    const splittedTime = time!.split("-")[0]!.split(":");
    const formattedTime = Number(splittedTime[0]! + splittedTime[1]!);

    // send notifications to users
    await this.userWaitlistService.sendNotificationsForAvailableTeeTime(
      date,
      formattedTime,
      courseId,
      userId,
      toCreate.id
    );
    // console.log("CREATING LISTING FOR DATE:", date, formattedTime);
    return { success: true, body: { listingId: toCreate.id }, message: "Listings created successfully." };
  };

  updateListingForBookings = async (
    userId: string,
    listId: string,
    updatedPrice: number,
    updatedSlots: number,
    bookingIds: string[],
    endTime: Date,
    allowSplit: boolean
  ) => {
    if (new Date().getTime() >= endTime.getTime()) {
      this.logger.warn("End time cannot be before current time");
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/createListingForBookings",
        userAgent: "",
        message: "TEE_TIME_LISTED_FAILED",
        stackTrace: "",
        additionalDetailsJSON: "End time cannot be before current time.",
      });
      throw new Error("End time cannot be before current time");
    }

    const existingListing = await this.database
      .select()
      .from(lists)
      .where(eq(lists.id, listId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving listing: ${err}`);
        throw new Error("Error retrieving listing");
      });

    if (!existingListing.length) {
      this.logger.warn(`Listing with ID ${listId} not found.`);
      throw new Error(`Listing with ID ${listId} not found.`);
    }

    const [previousListing] = existingListing;

    if (previousListing?.userId !== userId) {
      this.logger.warn(`User ${userId} does not own the specified listing.`);
      throw new Error("User does not own the specified listing.");
    }

    if (!updatedSlots) {
      this.logger.warn(`Slots cannot be less than one.`);
      throw new Error("Slots cannot be less than one.");
    }

    // Fetching user and booking details
    const [user] = await this.database.select().from(users).where(eq(users.id, userId)).execute();

    if (!user) {
      this.logger.error(`User with ID ${userId} not found.`);
      throw new Error(`User with ID ${userId} not found.`);
    }

    if (!bookingIds[0]) {
      this.logger.warn(`No bookings specified.`);
      throw new Error("No bookings specified.");
    }

    const bookingId: string = bookingIds[0];

    const ownedBookings = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
        isListed: bookings.isListed,
        providerDate: teeTimes.providerDate,
        playerCount: bookings.playerCount,
        totalAmount: bookings.totalAmount,
        timezoneCorrection: courses.timezoneCorrection,
        providerBookingId: bookings.providerBookingId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(and(eq(bookings.ownerId, userId), inArray(bookings.id, bookingIds)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateListingForBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            listId,
            updatedPrice,
            updatedSlots,
          }),
        });
        throw new Error("Error retrieving bookings");
      });
    if (!ownedBookings.length) {
      this.logger.warn(`User ${userId} does not own  specified bookings.`);
      throw new Error("User does not  own specified bookings.");
    }
    if (ownedBookings.length > 4) {
      this.logger.warn(`Cannot list more than 4 bookings.`);
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/updateListingForBookings",
        userAgent: "",
        message: "TEE_TIME_LISTED_FAILED",
        stackTrace: "",
        additionalDetailsJSON: "Cannot list more than 4 bookings.",
      });
      throw new Error("Cannot list more than 4 bookings.");
    }

    const [firstBooking] = ownedBookings;
    if (!firstBooking) {
      this.logger.warn(`Booking ${bookingId} not found.`);
      throw new Error(`Booking ${bookingId} not found.`);
    }
    const courseId = firstBooking.courseId ?? "";

    const [course] = await this.database
      .select({
        key: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        name: courses.name,
        id: courses.id,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving course: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateListingForBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error(`Error retrieving course`);
      });

    // Update the listing with new slots and price
    await this.database
      .update(lists)
      .set({
        listPrice: updatedPrice * 100,
        slots: updatedSlots,
        allowSplit,
      })
      .where(eq(lists.id, listId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error updating listing: ${err}`);
        throw new Error("Error updating listing");
      });

    // Send email notification about the listing update
    await this.notificationService
      .sendEmailByTemplate(
        user.email,
        "Listing Updated",
        process.env.SENDGRID_LISTING_UPDATED_TEMPLATE_ID!,
        {
          CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
          CourseURL: course?.websiteURL || "",
          CourseName: course?.name,
          HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
          CourseReservationID: firstBooking?.providerBookingId ?? "-",
          PlayDateTime: formatTime(
            firstBooking.providerDate ?? "",
            true,
            firstBooking.timezoneCorrection ?? 0
          ),
          PreviousPlayerCount: previousListing.slots,
          NewPlayerCount: updatedSlots,
          PreviousListedPrice: previousListing.listPrice / 100,
          NewListedPrice: updatedPrice,
          CustomerFirstName: user?.name?.split(" ")[0],
        },
        []
      )
      .catch((err) => {
        this.logger.error(`Error sending email: ${err}`);
        throw new Error("Error sending email");
      });

    return {
      success: true,
      message: "Listing updated and notification sent to the user.",
    };
  };

  /**
   * Cancel a pending listing and update associated bookings.
   * @param {string} userId - The ID of the user canceling the listing.
   * @param {string} listingId - The ID of the listing to be canceled.
   * @returns {Promise<void>} - Resolves when the listing is successfully canceled.
   * @throws {Error} - Throws an error if the listing is not found, is not pending, or is already deleted.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const listingId = "listing456";
   * await bookingService.cancelListing(userId, listingId);
   */
  cancelListing = async (userId: string, listingId: string) => {
    const [listing] = await this.database
      .select({
        id: lists.id,
        userId: lists.userId,
        // status: lists.status,
        isDeleted: lists.isDeleted,
      })
      .from(lists)
      .where(and(eq(lists.id, listingId), eq(lists.userId, userId)))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving listing: ${err}`);
        loggerService.errorLog({
          applicationName: "golfdistrict-foreup",
          clientIP: "",
          userId,
          url: "/cancelListing",
          userAgent: "",
          message: "TEE_TIME_CANCELLED",
          stackTrace: "",
          additionalDetailsJSON: "Error retrieving listing.",
        });
        throw new Error("Error retrieving listing");
      });
    if (!listing) {
      this.logger.warn(`Listing not found. Either listing does not exist or user does not own listing.`);
      throw new Error("Owned listing not found");
    }

    if (listing.isDeleted) {
      this.logger.warn(`Tee time not available anymore.`);
      throw new Error("Tee time not available anymore.");
    }
    const bookingIds = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(eq(bookings.listId, listingId))
      .execute();

    if (bookingIds && !bookingIds.length) {
      throw new Error("No booking found for this listing");
    }
    const courseId = bookingIds[0]?.courseId ?? "";
    await this.database.transaction(async (trx) => {
      await trx
        .update(lists)
        .set({
          isDeleted: true,
          cancelledByUserId: userId,
        })
        .where(eq(lists.id, listingId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error deleting listing: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/cancelListing",
            userAgent: "",
            message: "ERROR_DELETING_LISTING",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
              listingId,
            }),
          });
          trx.rollback();
        });
      for (const booking of bookingIds) {
        await trx
          .update(bookings)
          .set({
            isListed: false,
            listId: null,
          })
          .where(eq(bookings.id, booking.id))
          .execute()
          .catch((err) => {
            this.logger.error(`Error updating bookingId: ${booking.id}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/cancelListing",
              userAgent: "",
              message: "ERROR_DELETING_BOOKING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                listingId,
              }),
            });
            trx.rollback();
          });
      }
    });

    const [user] = await this.database
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const [course] = await this.database
      .select({
        websiteURL: courses.websiteURL,
        key: assets.key,
        extension: assets.extension,
        name: courses.name,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(`error fetching course data: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/cancelListing",
          userAgent: "",
          message: "ERROR_FETCHING_COURSE_DATA",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            listingId,
          }),
        });
        throw new Error("Error fetching course data");
      });

    if (!user) {
      this.logger.error(`Error fetching user data: ${userId} does not exist`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelListing",
        userAgent: "",
        message: "ERROR_FETCHING_USER_DATA",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          courseId,
          listingId,
        }),
      });
      throw new Error(`Error fetching user data: ${userId} does not exist`);
    }

    if (!course) {
      this.logger.error(`Error fetching course data: ${courseId} does not exist`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelListing",
        userAgent: "",
        message: "ERROR_FETCHING_COURSE_DATA",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          courseId,
          listingId,
        }),
      });
      throw new Error(`Error fetching course data: ${courseId} does not exist`);
    }

    if (user.email && user.name && course) {
      await this.notificationService.sendEmailByTemplate(
        user.email,
        "Listing Cancelled",
        process.env.SENDGRID_LISTING_CANCELLED_TEMPLATE_ID!,
        {
          CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
          CourseURL: course?.websiteURL || "",
          CourseName: course?.name,
          HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
          CustomerFirstName: user?.name?.split(" ")[0],
        },
        []
      );
    }
  };

  /**
   * Update a pending listing with new information.
   * @param {string} userId - The ID of the user updating the listing.
   * @param {number} listPrice - The updated list price for the listing.
   * @param {string[]} bookingIds - An array of booking IDs to be associated with the listing.
   * @param {Date} endTime - The updated end time for the listing.
   * @param {string} listingId - The ID of the listing to be updated.
   * @returns {Promise<void>} - Resolves when the listing is successfully updated.
   * @throws {Error} - Throws an error if the end time is before the current time,
   *                   if no bookings are specified, if the user does not own all specified bookings,
   *                   if more than 4 bookings are specified, if bookings are not for the same course,
   *                   if bookings are not for the same tee time, or if there is an error updating the listing.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const listPrice = 50;
   * const bookingIds = ["booking1", "booking2"];
   * const endTime = new Date("2023-12-31T23:59:59");
   * const listingId = "listing456";
   * await bookingService.updateListing(userId, listPrice, bookingIds, endTime, listingId);
   */
  updateListing = async (
    userId: string,
    listPrice: number,
    bookingIds: string[],
    endTime: Date,
    listingId: string
  ) => {
    if (new Date().getTime() >= endTime.getTime()) {
      this.logger.warn("End time cannot be before current time");
      throw new Error("End time cannot be before current time");
    }
    if (!bookingIds.length) {
      this.logger.warn(`No bookings specified.`);
      throw new Error("No bookings specified.");
    }
    const [listing] = await this.database
      .select({
        id: lists.id,
        userId: lists.userId,
        // status: lists.status,
        isDeleted: lists.isDeleted,
      })
      .from(lists)
      .where(and(eq(lists.id, listingId), eq(lists.userId, userId)))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving listing: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateListing",
          userAgent: "",
          message: "ERROR_RETRIEVING_LISTING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            listingId,
          }),
        });
        throw new Error("Error retrieving listing");
      });
    if (!listing) {
      this.logger.warn(`Listing not found. Either listing does not exist or user does not own listing.`);
      loggerService.errorLog({
        userId: userId,
        url: "/updateListing",
        userAgent: "",
        message: "LISTING_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          listingId,
        }),
      });
      throw new Error("Owned listing not found");
    }
    // if (listing.status !== "PENDING") {
    //   this.logger.warn(`Listing is not pending.`);
    //   throw new Error("Listing is not pending");
    // }
    if (listing.isDeleted) {
      this.logger.warn(`Tee time not available anymore.`);
      loggerService.errorLog({
        userId: userId,
        url: "/updateListing",
        userAgent: "",
        message: "TEE_TIME_NOT_AVAILABLE",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          listingId,
        }),
      });
      throw new Error("Tee time not available anymore.");
    }
    const ownedBookings = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(and(eq(bookings.ownerId, userId), inArray(bookings.id, bookingIds)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateListing",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
          }),
        });
        throw new Error("Error retrieving bookings");
      });

    if (ownedBookings.length !== bookingIds.length || !ownedBookings[0]) {
      this.logger.warn(`User ${userId} does not own all specified bookings.`);
      throw new Error("User does not own all specified bookings.");
    }
    if (ownedBookings.length > 4) {
      this.logger.warn(`Cannot list more than 4 bookings.`);
      throw new Error("Cannot list more than 4 bookings.");
    }
    //validate that all bookings are for the same course
    const courseIds = new Set(ownedBookings.map((booking) => booking.courseId));
    if (courseIds.size > 1) {
      this.logger.warn(`Bookings are not for the same course.`);
      throw new Error("Bookings are not for the same course.");
    }
    //validate that each booking is for the same tee time
    const teeTimeIds = new Set(ownedBookings.map((booking) => booking.teeTimeId));
    if (teeTimeIds.size > 1) {
      this.logger.warn(`Bookings are not for the same tee time.`);
      throw new Error("Bookings are not for the same tee time.");
    }

    const listingBookingIds = await this.database
      .select({
        id: bookings.id,
      })
      .from(bookings)
      .where(eq(bookings.listId, listingId))
      .execute();
    const bookingsToRemove = listingBookingIds.filter((booking) => !bookingIds.includes(booking.id));
    const toCreate: InsertList = {
      id: randomUUID(),
      userId: userId,
      listPrice: listPrice,
      // teeTimeId: ownedBookings[0].teeTimeId,
      // endTime: dateToUtcTimestamp(endTime),
      // courseId: ownedBookings[0].courseId??"",
      // status: "PENDING",
      isDeleted: false,
      // splitTeeTime: false,
    };
    await this.database
      .transaction(async (trx) => {
        //delete the old listing
        await trx
          .update(lists)
          .set({
            isDeleted: true,
          })
          .where(eq(lists.id, listingId))
          .execute()
          .catch((err) => {
            this.logger.error(`Error deleting listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/updateListing",
              userAgent: "",
              message: "ERROR_DELETING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                listingId,
              }),
            });
            trx.rollback();
          });
        //create a new listing
        await trx
          .insert(lists)
          .values(toCreate)
          .execute()
          .catch((err) => {
            this.logger.error(`Error creating listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/updateListing",
              userAgent: "",
              message: "ERROR_CREATING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                listingId,
              }),
            });
            trx.rollback();
          });
        //update all bookings
        for (const id of bookingIds) {
          await trx
            .update(bookings)
            .set({
              isListed: true,
              listId: toCreate.id,
            })
            .where(eq(bookings.id, id))
            .execute()
            .catch((err) => {
              this.logger.error(`Error updating bookingId: ${id}: ${err}`);
              loggerService.errorLog({
                userId: userId,
                url: "/updateListing",
                userAgent: "",
                message: "ERROR_UPDATING_BOOKING",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingId: id,
                }),
              });
              trx.rollback();
            });
        }
        //remove bookings from old listing
        for (const booking of bookingsToRemove) {
          await trx
            .update(bookings)
            .set({
              isListed: false,
              listId: null,
            })
            .where(eq(bookings.id, booking.id))
            .execute()
            .catch((err) => {
              this.logger.error(`Error updating bookingId: ${booking.id}: ${err}`);
              loggerService.errorLog({
                userId: userId,
                url: "/updateListing",
                userAgent: "",
                message: "ERROR_UPDATING_BOOKING",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingId: booking.id,
                }),
              });
              trx.rollback();
            });
        }
      })
      .catch((err) => {
        this.logger.error(`Error updating listing: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateListing",
          userAgent: "",
          message: "ERROR_UPDATING_LISTING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            listingId,
          }),
        });
        throw new Error("Error updating listing");
      });
  };

  checkIfTeeTimeStillListed = async (bookingId: string) => {
    console.log(`checkIfTeeTimeStillListed: ${bookingId}`);

    const [booking] = await this.database
      .select({ isListed: bookings.isListed })
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .execute();

    return booking?.isListed;
  };

  checkIfTeeTimeStillListedByListingId = async (listingId: string) => {
    const [booking] = await this.database
      .select({ isListed: bookings.isListed })
      .from(lists)
      .innerJoin(bookings, eq(bookings.listId, lists.id))
      .where(eq(lists.id, listingId))
      .execute();

    return booking?.isListed;
  };

  teeTimeAvailableFirsthandSpots = async (listingId: string) => {
    const [teeTime] = await this.database
      .select({ availableFirstHandSpots: teeTimes.availableFirstHandSpots })
      .from(teeTimes)
      .where(eq(teeTimes.id, listingId))
      .execute();
    if (teeTime?.availableFirstHandSpots) {
      return teeTime.availableFirstHandSpots;
    }
    return 0;
  };

  /**
   * Creates an offer for a set of bookings with a specified price and expiration.
   * @TODO payment intent
   * @param bookingIds - An array of booking IDs for which the offer is being created.
   * @param price - The offer price.
   * @param expiration - The expiration date and time for the offer.
   * @returns A promise that resolves to an array of created offers.
   * @throws Error - Throws an error if one or more bookings are not found or if a booking is not active.
   */
  createOfferOnBookings = async (userId: string, bookingIds: string[], price: number, expiration: Date) => {
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
        ownerId: bookings.ownerId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(inArray(bookings.id, bookingIds))
      .leftJoin(lists, eq(lists.id, bookings.listId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createOfferOnBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
            price,
            expiration,
          }),
        });
        throw new Error("Error retrieving bookings");
      });
    if (!data.length || data.length !== bookingIds.length || !data[0]) {
      this.logger.warn(`No bookings found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createOfferOnBookings",
        userAgent: "",
        message: "NO_BOOKINGS_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingIds,
          price,
          expiration,
        }),
      });
      throw new Error("No bookings found");
    }
    const firstTeeTime = data[0].teeTimeId;
    const courseId = data[0].courseId ?? "";
    if (!data.every((booking) => booking.teeTimeId === firstTeeTime)) {
      this.logger.error(`All bookings must be under the same tee time.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createOfferOnBookings",
        userAgent: "",
        message: "ALL_BOOKINGS_MUST_BE_UNDER_SAME_TEE_TIME",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingIds,
          price,
          expiration,
        }),
      });
      throw new Error("All bookings must be under the same tee time.");
    }

    const minimumOfferPrice = Math.max(...data.map((booking) => booking.minimumOfferPrice));
    if (price === 0) {
      this.logger.error(`Offer price must be higher than 0.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createOfferOnBookings",
        userAgent: "",
        message: "OFFER_PRICE_MUST_BE_HIGHER_THAN_0",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingIds,
          price,
          expiration,
        }),
      });
      throw new Error("Offer price must be higher than 0");
    }
    if (price < minimumOfferPrice) {
      this.logger.error(`Offer price must be higher than the minimum offer price.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createOfferOnBookings",
        userAgent: "",
        message: "OFFER_PRICE_MUST_BE_HIGHER_THAN_MINIMUM_OFFER_PRICE",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingIds,
          price,
          expiration,
        }),
      });
      throw new Error("Offer price must be higher than the minimum offer price.");
    }
    await this.database.transaction(async (trx) => {
      const offerId = randomUUID();
      await trx
        .insert(offers)
        .values({
          id: offerId,
          buyerId: userId,
          price: price,
          paymentIntentId: "@TODO",
          expiresAt: dateToUtcTimestamp(expiration),
          status: "PENDING",
          courseId: courseId,
        })
        .execute()
        .catch((err) => {
          this.logger.error(`Error creating offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/createOfferOnBookings",
            userAgent: "",
            message: "ERROR_CREATING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              bookingIds,
            }),
          });
          throw new Error("Error creating offer");
        });
      await trx
        .insert(userBookingOffers)
        .values(
          bookingIds.map((bookingId) => ({
            offerId: offerId,
            bookingId: bookingId,
          }))
        )
        .execute()
        .catch((err) => {
          this.logger.error(`Error creating booking offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/createOfferOnBookings",
            userAgent: "",
            message: "ERROR_CREATING_BOOKING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              bookingIds,
            }),
          });
          throw new Error("Error creating booking offer");
        });
    });
    const [activeOffers] = await this.database
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(offers)
      .where(
        and(
          eq(offers.buyerId, userId),
          eq(offers.status, "PENDING"),
          eq(offers.isDeleted, false),
          eq(offers.courseId, courseId),
          gte(offers.expiresAt, dateToUtcTimestamp(new Date()))
        )
      )
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offers: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createOfferOnBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingIds,
          }),
        });
        throw new Error("Error active offers");
      });

    await this.notificationService.createNotification(
      userId,
      "OFFER_CREATED",
      `Offer creation successful`,
      courseId
    );
    await this.notificationService.createNotification(
      data[0].ownerId,
      "NEW_OFFER",
      `someone has created an offer for your booking`,
      courseId
    );

    if (activeOffers && activeOffers.count > 1) {
      return { success: true, message: `You have ${activeOffers.count} for this course` };
    }
    return { success: true, message: "Offer created successfully." };
  };

  /**
   * Cancel a pending offer on a booking.
   * @param {string} userId - The ID of the user canceling the offer.
   * @param {string} offerId - The ID of the offer to be canceled.
   * @returns {Promise<void>} - Resolves when the offer is successfully canceled.
   * @throws {Error} - Throws an error if the offer is not found, if the user does not own the offer,
   *                   if the offer is not pending, if the offer is already deleted,
   *                   or if there is an error canceling the offer.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const offerId = "offer456";
   * await bookingService.cancelOfferOnBooking(userId, offerId);
   */
  cancelOfferOnBooking = async (userId: string, offerId: string) => {
    const offerData = await this.database
      .select({
        buyerId: offers.buyerId,
        status: offers.status,
        isDeleted: offers.isDeleted,
        linkedBookingOffer: userBookingOffers.bookingId,
      })
      .from(offers)
      .leftJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .where(eq(offers.id, offerId))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offer: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/cancelOfferOnBooking",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            offerId,
          }),
        });
        throw new Error("Error retrieving offer");
      });
    if (!offerData?.[0]) {
      this.logger.warn(`Offer not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelOfferOnBooking",
        userAgent: "",
        message: "OFFER_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Offer not found");
    }
    const bookingIds = offerData.map((offers) => offers.linkedBookingOffer);
    const { buyerId, status, isDeleted } = offerData[0];
    if (buyerId !== userId) {
      this.logger.warn(`User does not own offer.`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelOfferOnBooking",
        userAgent: "",
        message: "USER_DOES_NOT_OWN_OFFER",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("User does not own offer");
    }
    if (status !== "PENDING") {
      this.logger.warn(`Offer is not pending.`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelOfferOnBooking",
        userAgent: "",
        message: "OFFER_IS_NOT_PENDING",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Offer is not pending");
    }
    if (isDeleted) {
      this.logger.warn(`Offer is already deleted.`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelOfferOnBooking",
        userAgent: "",
        message: "OFFER_IS_ALREADY_DELETED",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Offer is already deleted");
    }
    await this.database.transaction(async (trx) => {
      await trx
        .update(offers)
        .set({
          isDeleted: true,
        })
        .where(eq(offers.id, offerId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error deleting offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/cancelOfferOnBooking",
            userAgent: "",
            message: "ERROR_DELETING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              offerId,
            }),
          });
          trx.rollback();
        });
      await trx
        .update(userBookingOffers)
        .set({ isDeleted: true })
        .where(
          and(
            inArray(userBookingOffers.bookingId, bookingIds as string[]),
            eq(userBookingOffers.offerId, offerId)
          )
        )
        .execute()
        .catch((err) => {
          this.logger.error(`Error deleting booking offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/cancelOfferOnBooking",
            userAgent: "",
            message: "ERROR_DELETING_BOOKING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              offerId,
            }),
          });
          trx.rollback();
        });
    });
  };
  /**
   * Accepts an offer for a booking.
   *
   * @param userId - The ID of the user accepting the offer.
   * @param offerId - The ID of the offer.
   * @returns A promise that resolves to the updated offer with status set to `ACCEPTED`.
   * @throws Error - Throws an error if the booking is not found or is not active.
   */
  acceptOffer = async (userId: string, offerId: string) => {
    const offer = await this.database
      .select({
        id: offers.id,
        buyerId: offers.buyerId,
        bookingIds: userBookingOffers.bookingId,
        bookingOwnerId: bookings.ownerId,
        price: offers.price,
        listingId: sql`CASE WHEN ${bookings.listId} IS NOT NULL THEN ${lists.id} ELSE NULL END`,
      })
      .from(offers)
      .where(eq(offers.id, offerId))
      .leftJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .leftJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .leftJoin(lists, eq(lists.id, bookings.listId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offer: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/acceptOffer",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            offerId,
          }),
        });
        throw new Error("Error retrieving offer");
      });

    if (!offer?.[0]) {
      this.logger.warn(`Offer not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/acceptOffer",
        userAgent: "",
        message: "OFFER_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Offer not found");
    }
    const bookingIds = offer.map((offers) => offers.bookingIds);
    const { price, buyerId } = offer[0];
    //if the user does not own each booking then return error
    const bookingsOwner = offer.map((offers) => offers.bookingOwnerId);
    const listingIds = offer.map((offers) => offers.listingId);
    if (!bookingsOwner.every((id) => id === userId)) {
      this.logger.warn(`User does not own all bookings.`);
      loggerService.errorLog({
        userId: userId,
        url: "/acceptOffer",
        userAgent: "",
        message: "USER_DOES_NOT_OWN_ALL_BOOKINGS",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("User does not own all bookings");
    }
    //check that booking ids are not null or empty
    if (!bookingIds.length || !bookingIds[0]?.length) {
      this.logger.warn(`Booking not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/acceptOffer",
        userAgent: "",
        message: "BOOKING_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Booking not found");
    }
    //@TODO capture payment intent

    // await this.hyperSwitchService.capturePaymentIntent(buyerId, price);
    this.tokenizeService.transferBookings(bookingsOwner[0]!, bookingIds as string[], buyerId, price);

    //accept the offer
    await this.database.transaction(async (trx) => {
      await trx
        .update(offers)
        .set({
          status: "ACCEPTED",
        })
        .where(eq(offers.id, offerId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error accepting offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/acceptOffer",
            userAgent: "",
            message: "ERROR_ACCEPTING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              offerId,
            }),
          });
          trx.rollback();
        });
      await trx
        .update(userBookingOffers)
        .set({ status: "ACCEPTED" })
        .where(
          and(
            inArray(userBookingOffers.bookingId, bookingIds as string[]),
            eq(userBookingOffers.offerId, offerId)
          )
        )
        .execute()
        .catch((err) => {
          this.logger.error(`Error accepting booking offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/acceptOffer",
            userAgent: "",
            message: "ERROR_ACCEPTING_BOOKING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              offerId,
            }),
          });
          trx.rollback();
        });
      //delete all listing associated with purchased bookings
      if (listingIds) {
        await trx
          .update(lists)
          .set({ isDeleted: true })
          .where(and(inArray(lists.id, listingIds as string[])))
          .execute()
          .catch((err) => {
            this.logger.error(`Error deleting listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/acceptOffer",
              userAgent: "",
              message: "ERROR_DELETING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                offerId,
              }),
            });
            trx.rollback();
          });
        await trx
          .update(bookings)
          .set({ isListed: false, listId: null })
          .where(and(inArray(bookings.id, bookingIds as string[])))
          .execute()
          .catch((err) => {
            this.logger.error(`Error deleting listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/acceptOffer",
              userAgent: "",
              message: "ERROR_DELETING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                offerId,
              }),
            });
            trx.rollback();
          });
      }
    });
    //@TODO create notification

    return { success: true, message: "Offer accepted successfully." };
  };

  /**
   * Reject a pending offer on a booking.
   * @param {string} userId - The ID of the user rejecting the offer.
   * @param {string} offerId - The ID of the offer to be rejected.
   * @returns {Promise<{ success: boolean, message: string }>} - Resolves with a success message
   * if the offer is successfully rejected.
   * @throws {Error} - Throws an error if the offer is not found, or if there is an error rejecting the offer.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const offerId = "offer456";
   * const result = await bookingService.rejectOffer(userId, offerId);
   * // result: { success: true, message: "Offer accepted successfully." }
   */
  rejectOffer = async (userId: string, offerId: string) => {
    const offer = await this.database
      .select({
        id: offers.id,
        buyerId: offers.buyerId,
        bookingIds: userBookingOffers.bookingId,
        bookingOwnerId: bookings.ownerId,
      })
      .from(offers)
      .where(eq(offers.id, offerId))
      .leftJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .leftJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offer: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/rejectOffer",
          userAgent: "",
          message: "ERROR_REJECTING_OFFER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            offerId,
          }),
        });
        throw new Error("Error retrieving offer");
      });
    if (!offer) {
      this.logger.warn(`Offer not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/rejectOffer",
        userAgent: "",
        message: "OFFER_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("Offer not found");
    }
    const bookingIds = offer.map((offers) => offers.bookingIds);
    const bookingsOwned = offer.map((offers) => offers.bookingOwnerId);
    if (!bookingsOwned.every((ownerId) => ownerId === userId)) {
      this.logger.warn(`User does not own all bookings.`);
      loggerService.errorLog({
        userId: userId,
        url: "/rejectOffer",
        userAgent: "",
        message: "USER_DOES_NOT_OWN_ALL_BOOKINGS",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          offerId,
        }),
      });
      throw new Error("User does not own all bookings");
    }

    //reject the offer
    await this.database.transaction(async (trx) => {
      await trx
        .update(offers)
        .set({
          status: "REJECTED",
        })
        .where(eq(offers.id, offerId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error accepting offer: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/rejectOffer",
            userAgent: "",
            message: "ERROR_ACCEPTING_OFFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              offerId,
            }),
          });
          throw new Error("Error accepting offer");
        });
      //update userBookingOffers
      await trx
        .update(userBookingOffers)
        .set({ status: "REJECTED" })
        .where(
          and(
            inArray(userBookingOffers.bookingId, bookingIds as string[]),
            eq(userBookingOffers.offerId, offerId)
          )
        );
    });
    //@TODO create notification

    return { success: true, message: "Offer accepted successfully." };
  };

  /**
   * Retrieves all offers associated with a booking.
   *
   * @param bookingId - The ID of the booking.
   * @returns A promise that resolves to an array of offers.
   */
  getOffersForBooking = async (bookingId: string, _limit = 10, _cursor?: string) => {
    const userImage = alias(assets, "userImage");
    const courseImage = alias(assets, "courseImage");

    const data = await this.database
      .select({
        id: offers.id,
        expiresAt: offers.expiresAt,
        price: offers.price,
        createdAt: offers.createdAt,
        status: offers.status,
        isDeclined: offers.isDeclined,
        isAccepted: offers.isAccepted,
        isDeleted: offers.isDeleted,
        buyerId: offers.buyerId,
        courseId: offers.courseId,
        courseName: courses.name,
        teeTimeDate: teeTimes.date,
        teeTimeId: teeTimes.id,
        originalGreenFee: teeTimes.greenFeePerPlayer,
        lastHighestSale: sql<number | null>`MAX(${transfers.amount})`,
        courseImage: {
          key: courseImage.key,
          extension: courseImage.extension,
        },
        offeredBy: {
          userId: users.id,
          name: users.name,
          handle: users.handle,
          key: userImage.key,
          extension: userImage.extension,
        },
        golferCount: sql<number | null>`COUNT(DISTINCT ${userBookingOffers.bookingId})`,
      })
      .from(offers)
      .innerJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .innerJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(users, eq(users.id, offers.buyerId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(courseImage, eq(courseImage.courseId, courses.logoId))
      .leftJoin(userImage, eq(userImage.id, users.image))
      .leftJoin(transfers, eq(transfers.bookingId, bookings.id))
      .where(
        and(
          eq(bookings.id, bookingId),
          eq(offers.isDeleted, false),
          gte(teeTimes.date, currentUtcTimestamp())
        )
      )
      .groupBy(
        offers.id,
        offers.expiresAt,
        offers.price,
        offers.createdAt,
        offers.status,
        offers.isDeclined,
        offers.isAccepted,
        offers.isDeleted,
        offers.buyerId,
        offers.courseId,
        courses.name,
        teeTimes.date,
        teeTimes.id,
        courseImage.key,
        courseImage.extension,
        users.id,
        users.name,
        userImage.key,
        userImage.extension
      )
      .orderBy(desc(offers.createdAt))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offers: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/getOffersForBooking",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingId,
          }),
        });
        throw new Error("Error retrieving offers");
      });

    const res = data.map((offer) => ({
      offer: {
        details: {
          courseName: offer.courseName,
          teeTimeDate: offer.teeTimeDate,
          teeTimeId: offer.teeTimeId,
          courseImage: offer.courseImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.courseImage.key}.${offer.courseImage.extension}`
            : "/defaults/default-course.webp",
        },
        offeredBy: {
          userId: offer.offeredBy.userId,
          name: offer.offeredBy.name,
          handle: offer.offeredBy.handle,
          image: offer.offeredBy.key
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.offeredBy.key}.${offer.offeredBy.extension}`
            : "/defaults/default-profile.webp",
        },
        amountOffered: offer.price,
        originalPrice: offer.originalGreenFee,
        lastHighestSale: offer.lastHighestSale,
        golfers: offer.golferCount,
        status: offer.status,
        expiresAt: offer.expiresAt,
        offerId: offer.id,
      },
    }));
    return res;
  };

  /**
   * Retrieve offers sent by a user for a specific course.
   * @param {string} userId - The ID of the user sending the offers.
   * @param {string} courseId - The ID of the course for which offers are being retrieved.
   * @param {number} [limit=10] - The maximum number of offers to retrieve. Default is 10.
   * @param {string | null} [cursor] - A cursor for pagination.
   * @returns {Promise<{ offer: OfferData }[]>} - Resolves with an array of offer data for the specified user and course.
   * @throws {Error} - Throws an error if there is an issue retrieving the offers.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const courseId = "course456";
   * const limit = 5;
   * const result = await bookingService.getOfferSentForUser(userId, courseId, limit);
   * // result: [{ offer: OfferData }, { offer: OfferData }, ...]
   */
  async getOfferSentForUser(userId: string, courseId: string, _limit = 10, _cursor?: string | null) {
    const userImage = alias(assets, "userImage");
    const ownerImage = alias(assets, "ownerImage");
    const bookingOwner = alias(users, "bookingOwner");
    const courseImage = alias(assets, "courseImage");
    const userBooking = alias(bookings, "userBooking");

    const data = await this.database
      .select({
        id: offers.id,
        expiresAt: offers.expiresAt,
        price: offers.price,
        createdAt: offers.createdAt,
        status: offers.status,
        isDeclined: offers.isDeclined,
        isAccepted: offers.isAccepted,
        isDeleted: offers.isDeleted,
        buyerId: offers.buyerId,
        courseId: offers.courseId,
        courseName: courses.name,
        teeTimeDate: teeTimes.providerDate,
        teeTimeId: teeTimes.id,
        originalGreenFee: teeTimes.greenFeePerPlayer,
        lastHighestSale: sql<number | null>`MAX(${transfers.amount})`,
        courseImage: {
          key: courseImage.key,
          extension: courseImage.extension,
        },
        ownedBy: {
          userId: bookingOwner.id,
          name: bookingOwner.name,
          handle: bookingOwner.handle,
          key: ownerImage.key,
          extension: ownerImage.extension,
        },
        offeredBy: {
          userId: users.id,
          name: users.name,
          handle: users.handle,
          key: userImage.key,
          extension: userImage.extension,
        },
        golferCount: sql<number | null>`COUNT(DISTINCT ${userBookingOffers.bookingId})`,
      })
      .from(offers)
      .innerJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .innerJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(userBooking, eq(userBooking.teeTimeId, bookings.teeTimeId))
      .leftJoin(users, eq(users.id, offers.buyerId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(courseImage, eq(courseImage.id, courses.logoId))
      .leftJoin(userImage, eq(userImage.id, users.image))
      .leftJoin(transfers, eq(transfers.bookingId, bookings.id))
      .leftJoin(bookingOwner, eq(bookingOwner.id, userBooking.ownerId))
      .leftJoin(ownerImage, eq(ownerImage.id, bookingOwner.image))
      .where(
        and(
          eq(offers.buyerId, userId),
          eq(offers.isDeleted, false),
          eq(offers.courseId, courseId)
          //gte(teeTimes.date, currentUtcTimestamp())
        )
      )
      .groupBy(
        offers.id,
        offers.expiresAt,
        offers.price,
        offers.createdAt,
        offers.status,
        offers.isDeclined,
        offers.isAccepted,
        offers.isDeleted,
        offers.buyerId,
        offers.courseId,
        courses.name,
        teeTimes.date,
        teeTimes.id,
        courseImage.key,
        courseImage.extension,
        users.id,
        users.name,
        userImage.key,
        userImage.extension,
        ownerImage.key,
        ownerImage.extension,
        bookingOwner.id,
        bookingOwner.name,
        bookingOwner.handle
      )
      .orderBy(desc(offers.expiresAt))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offers: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/getOfferSentForUser",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error retrieving offers");
      });

    const res = data.map((offer) => ({
      offer: {
        courseId: offer.courseId,
        details: {
          courseName: offer.courseName,
          teeTimeDate: offer.teeTimeDate,
          teeTimeId: offer.teeTimeId,
          courseImage: offer.courseImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.courseImage.key}.${offer.courseImage.extension}`
            : "/defaults/default-course.webp",
        },
        offeredBy: {
          userId: offer.offeredBy.userId,
          name: offer.offeredBy.name,
          handle: offer.offeredBy.handle,
          image: offer.offeredBy.key
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.offeredBy.key}.${offer.offeredBy.extension}`
            : "/defaults/default-profile.webp",
        },
        ownedBy: {
          userId: offer.ownedBy.userId,
          name: offer.ownedBy.name,
          handle: offer.ownedBy.handle,
          image: offer.ownedBy.key
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.ownedBy.key}.${offer.ownedBy.extension}`
            : "/defaults/default-profile.webp",
        },
        offerAmount: offer.price,
        originalPrice: offer.originalGreenFee,
        lastHighestSale: offer.lastHighestSale,
        golfers: offer.golferCount,
        status: offer.status,
        expiresAt: offer.expiresAt,
        offerId: offer.id,
      },
    }));
    return res;
  }

  /**
   * Retrieves all offers created by a user.
   *
   * @param userId - The ID of the user.
   * @returns A promise that resolves to an array of offers.
   */
  async getOfferReceivedForUser(userId: string, courseId: string, _limit = 10, _cursor?: string | null) {
    const userImage = alias(assets, "userImage");
    const courseImage = alias(assets, "courseImage");
    const userBooking = alias(bookings, "userBooking");
    const data = await this.database
      .select({
        id: offers.id,
        expiresAt: offers.expiresAt,
        price: offers.price,
        createdAt: offers.createdAt,
        status: offers.status,
        isDeclined: offers.isDeclined,
        isAccepted: offers.isAccepted,
        isDeleted: offers.isDeleted,
        buyerId: offers.buyerId,
        courseId: offers.courseId,
        courseName: courses.name,
        teeTimeDate: teeTimes.providerDate,
        teeTimeId: teeTimes.id,
        originalGreenFee: teeTimes.greenFeePerPlayer,
        lastHighestSale: sql<number | null>`MAX(${transfers.amount})`,
        courseImage: {
          key: courseImage.key,
          extension: courseImage.extension,
        },
        offeredBy: {
          userId: users.id,
          name: users.name,
          handle: users.handle,
          key: userImage.key,
          extension: userImage.extension,
        },
        golferCount: sql<number | null>`COUNT(DISTINCT ${userBookingOffers.bookingId})`,
      })
      .from(offers)
      .leftJoin(userBookingOffers, eq(userBookingOffers.offerId, offers.id))
      .leftJoin(bookings, eq(bookings.id, userBookingOffers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(userBooking, eq(userBooking.ownerId, userId))
      .leftJoin(users, eq(users.id, offers.buyerId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(courseImage, eq(courseImage.id, courses.logoId))
      .leftJoin(userImage, eq(userImage.id, users.image))
      .leftJoin(transfers, eq(transfers.bookingId, bookings.id))
      .where(
        and(
          eq(offers.courseId, courseId),
          eq(offers.isDeleted, false),
          eq(offers.status, "PENDING"),
          eq(bookings.ownerId, userId),
          gte(teeTimes.date, currentUtcTimestamp())
        )
      )
      .groupBy(
        offers.id,
        offers.expiresAt,
        offers.price,
        offers.createdAt,
        offers.status,
        offers.isDeclined,
        offers.isAccepted,
        offers.isDeleted,
        offers.buyerId,
        offers.courseId,
        courses.name,
        teeTimes.date,
        teeTimes.id,
        courseImage.key,
        courseImage.extension,
        users.id,
        users.name,
        userImage.key,
        userImage.extension
      )
      .orderBy(desc(offers.expiresAt))

      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving offers: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/getOfferReceivedForUser",
          userAgent: "",
          message: "ERROR_RETRIEVING_OFFERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error("Error retrieving offers");
      });

    const res = data.map((offer) => ({
      offer: {
        courseId,
        details: {
          courseName: offer.courseName,
          teeTimeDate: offer.teeTimeDate,
          teeTimeId: offer.teeTimeId,
          courseImage: offer.courseImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.courseImage.key}.${offer.courseImage.extension}`
            : "/defaults/default-course.webp",
        },
        offeredBy: {
          userId: offer.offeredBy.userId,
          name: offer.offeredBy.name,
          handle: offer.offeredBy.handle,
          image: offer.offeredBy.key
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${offer.offeredBy.key}.${offer.offeredBy.extension}`
            : "/defaults/default-profile.webp",
        },
        amountOffered: offer.price,
        originalPrice: offer.originalGreenFee,
        lastHighestSale: offer.lastHighestSale,
        golfers: offer.golferCount,
        status: offer.status,
        expiresAt: offer.expiresAt,
        offerId: offer.id,
      },
    }));
    return res;
  }

  /**
   * Update the names associated with a list of bookings owned by a user.
   * @param {string} userId - The ID of the user who owns the bookings.
   * @param {string[]} bookingIds - An array of booking IDs to be updated.
   * @param {string[]} usersToAdd - An array of user ids to be associated with each booking.
   * @returns {Promise<void>} - Resolves once the names on the bookings are successfully updated.
   * @throws {Error} - Throws an error if there is an issue retrieving or updating the bookings.
   * @example
   * @TODO add sorting for names guest should be last
   * // Example usage:
   * const userId = "user123";
   * const bookingIds = ["bookingId1", "bookingId2"];
   * const names = ["New Name 1", "New Name 2"];
   * await bookingService.updateNamesOnBookings(userId, bookingIds, names);
   */
  updateNamesOnBookings = async (userId: string, usersToUpdate: InviteFriend[], bookingId: string) => {
    const data = await this.database
      .select({
        id: bookings.id,
        nameOnBooking: bookings.nameOnBooking,
        internalId: providers.internalId,
        providerCourseId: providerCourseLink.providerCourseId,
        providerTeeSheetId: providerCourseLink.providerTeeSheetId,
        courseId: teeTimes.courseId,
        providerBookingId: bookings.providerBookingId,
        providerId: providerCourseLink.providerId,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        status: bookings.status,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(teeTimes.courseId, courses.id))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(and(eq(bookings.ownerId, userId), eq(bookings.id, bookingId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/updateNamesOnBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            bookingId,
            usersToUpdate,
          }),
        });
        throw new Error("Error retrieving bookings");
      });

    if (!data.length || !data[0]) {
      this.logger.warn(`No bookings found. or user does not own all bookings`);
      loggerService.errorLog({
        userId: userId,
        url: "/updateNamesOnBookings",
        userAgent: "",
        message: "NO_BOOKINGS_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingId,
          usersToUpdate,
        }),
      });
      throw new Error("No bookings found");
    }

    if (data[0].status === "CANCELLED") {
      return { success: false, message: "This Reservation is already Cancelled" };
    }

    const firstBooking = data[0];
    if (!firstBooking) {
      this.logger.warn(`bookings not found`);
      loggerService.errorLog({
        userId: userId,
        url: "/updateNamesOnBookings",
        userAgent: "",
        message: "BOOKING_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingId,
          usersToUpdate,
        }),
      });
      throw new Error("bookings not found");
    }
    const { token, provider } = await this.providerService.getProviderAndKey(
      firstBooking.internalId!,
      firstBooking.courseId!,
      firstBooking.providerCourseConfiguration!
    );
    if (!firstBooking.providerId || !firstBooking.providerCourseId || !firstBooking.courseId) {
      this.logger.error(`provider id, course id, or provider course id not found`);
      loggerService.errorLog({
        userId: userId,
        url: "/updateNamesOnBookings",
        userAgent: "",
        message: "PROVIDER_ID_OR_COURSE_ID_NOT_FOUND",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          bookingId,
          usersToUpdate,
        }),
      });
      throw new Error("provider id, course id, or provider course id not found");
    }
    if (!provider.supportsPlayerNameChange) {
      return { success: false, message: "Course doesn't support name changes" };
    }

    // Check if the logged-in user's ID is present in any email (excluding the first object)
    const foundUser = usersToUpdate.slice(1).find((user) => user.id === userId);

    if (foundUser) {
      throw new Error(`You’re already in the tee time and can’t invite yourself.`);
    }

    // Continue processing...
    usersToUpdate = usersToUpdate.filter((user) => user.id !== userId);

    if (usersToUpdate.length === 0) {
      throw new Error("You cannot update your own name on the booking.");
    }

    //check if user created in fore-up or not
    // call find or create for user and update according to slot
    const customers: Customer[] = [];
    const providerDataToUpdate: {
      playerNumber: string | null;
      customerId: string | number | null;
      name: string | null;
      slotId: string | null;
    }[] = [];
    for (const user of usersToUpdate) {
      try {
        if (firstBooking.nameOnBooking === user.name) {
          continue;
        }
        if (user.id !== "") {
          const customerData = await this.providerService.findOrCreateCustomer(
            firstBooking.courseId,
            firstBooking.providerId,
            firstBooking.providerCourseId,
            user.id,
            provider,
            token
          );
          providerDataToUpdate.push({ ...customerData, slotId: user.slotId });
          //update on foreup with the slotId with the personId recieved in customer
        } else if (user.name !== "") {
          providerDataToUpdate.push({
            name: user.name,
            playerNumber: "",
            customerId: 0,
            slotId: user.slotId,
          });
        }
      } catch (error) {
        console.log("Error creating customer", error);
        throw new Error("Error creating customer");
      }
    }

    console.log("providerDataToUpdate:");
    console.dir(providerDataToUpdate, { depth: null });
    for (const user of providerDataToUpdate) {
      const nameChangeOptions = provider?.getBookingNameChangeOptions({
        name: user.name || "",
        providerBookingId: firstBooking.providerBookingId,
        providerCustomerId:
          typeof user.customerId === "number" ? user.customerId?.toString() : user.customerId ?? "",
      });

      await provider?.updateTeeTime(
        token || "",
        firstBooking?.providerCourseId || "",
        firstBooking?.providerTeeSheetId || "",
        firstBooking.providerBookingId,
        nameChangeOptions,
        user.slotId || ""
      );
    }
    //updating bookingslots data
    await Promise.all(
      usersToUpdate.map((user, index) => {
        this.database
          .update(bookingslots)
          .set({
            name: user.name || "",
            customerId: user.id || "",
          })
          .where(eq(bookingslots.slotnumber, user.slotId))
          .execute()
          .catch((err) => {
            this.logger.error(`Error setting names on booking: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/updateNamesOnBookings",
              userAgent: "",
              message: "ERROR_SETTING_NAMES_ON_BOOKING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                bookingId,
                usersToUpdate,
              }),
            });
          });
      })
    );
  };

  /**
   * Set the minimum offer price for all bookings owned by a user for a specific tee time.
   * @param {string} userId - The ID of the user who owns the bookings.
   * @param {string} teeTimeId - The ID of the tee time for which the minimum offer price is to be set.
   * @param {number} minimumOfferPrice - The new minimum offer price to be set.
   * @returns {Promise<void>} - Resolves once the minimum offer prices are successfully updated.
   * @throws {Error} - Throws an error if there is an issue retrieving or updating the bookings.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const teeTimeId = "teeTime123";
   * const minimumOfferPrice = 50.0;
   * await bookingService.setMinimumOfferPrice(userId, teeTimeId, minimumOfferPrice);
   */
  setMinimumOfferPrice = async (userId: string, teeTimeId: string, minimumOfferPrice: number) => {
    //Dummy changesto trigger build.
    let message: string | undefined;
    await this.database.transaction(async (trx) => {
      //find all booking for this tee time owned by this user
      const data = await this.database
        .select({
          id: bookings.id,
        })
        .from(bookings)
        .where(and(eq(bookings.ownerId, userId), eq(bookings.teeTimeId, teeTimeId)))
        .execute()
        .catch((err) => {
          this.logger.error(`Error retrieving bookings: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/setMinimumOfferPrice",
            userAgent: "",
            message: "ERROR_RETRIEVING_BOOKINGS",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeId,
              minimumOfferPrice,
            }),
          });
          message = "Error retrieving bookings";
          trx.rollback();
        });
      if (!data || !data.length) {
        this.logger.warn(`No bookings found.`);
        message = "No bookings found";
        throw new Error("No bookings found");
      }
      //update minimum offer price on each booking
      for (const booking of data) {
        await trx
          .update(bookings)
          .set({
            minimumOfferPrice: minimumOfferPrice,
          })
          .where(eq(bookings.id, booking.id))
          .execute()
          .catch((err) => {
            this.logger.error(`Error updating bookingId: ${booking.id}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/setMinimumOfferPrice",
              userAgent: "",
              message: "ERROR_UPDATING_BOOKING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                userId,
                teeTimeId,
                minimumOfferPrice,
              }),
            });
            message = "Error updating bookingId";
            trx.rollback();
          });
      }
    });
    if (message) {
      throw new Error(message);
    }
  };
  normalizeCartData = async ({ cartId = "", userId = "" }) => {
    const [customerCartData]: any = await this.database
      .select({ cart: customerCarts.cart, cartId: customerCarts.id, paymentId: customerCarts.paymentId })
      .from(customerCarts)
      .where(and(eq(customerCarts.id, cartId), eq(customerCarts.userId, userId)))
      .execute();

    let slotInfo = customerCartData?.cart?.cart?.filter(
      ({ product_data }: ProductData) => product_data.metadata.type === "first_hand"
    );
    if (!slotInfo.length) {
      slotInfo = customerCartData?.cart?.cart?.filter(
        ({ product_data }: ProductData) => product_data.metadata.type === "second_hand"
      );
    }
    if (!slotInfo.length) {
      slotInfo = customerCartData?.cart?.cart?.filter(
        ({ product_data }: ProductData) => product_data.metadata.type === "first_hand_group"
      );
    }
    const playerCountFromCart = slotInfo[0]?.product_data?.metadata?.number_of_bookings;
    const markupCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "markup")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;
    const markupCharge1 = customerCartData?.cart?.cart
      ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "markup")
      ?.reduce((acc: number, i: any) => acc + i.price, 0);
    const cartFeeInfo = customerCartData?.cart?.cart?.filter(
      ({ product_data }: ProductData) => product_data.metadata.type === "cart_fee"
    );
    const cartFeeCharge = cartFeeInfo[0]?.product_data?.metadata?.amount || 0;

    const primaryData = {
      primaryGreenFeeCharge: isNaN(
        slotInfo[0].price -
          cartFeeCharge * (slotInfo[0]?.product_data?.metadata?.number_of_bookings || 0) -
          markupCharge1
      )
        ? slotInfo[0].price - markupCharge1
        : slotInfo[0].price -
          cartFeeCharge * (slotInfo[0]?.product_data?.metadata?.number_of_bookings ?? 0) -
          markupCharge1, //slotInfo[0].price- cartFeeCharge*slotInfo[0]?.product_data?.metadata?.number_of_bookings,
      teeTimeId: slotInfo[0].product_data.metadata.tee_time_id,
      playerCount:
        slotInfo[0].product_data.metadata.number_of_bookings === undefined
          ? customerCartData.cart.playerCount
          : slotInfo[0].product_data.metadata.number_of_bookings,
      teeTimeIds: slotInfo[0].product_data.metadata.tee_time_ids,
      minPlayersPerBooking: slotInfo[0].product_data.metadata.min_players_per_booking,
    };
    console.log("primaryData=======>", primaryData);
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

    const merchandiseCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "merchandise")
        ?.reduce((acc: number, i: any) => acc + i.price, 0) / 100;

    const merchandiseWithTaxOverrideCharge =
      customerCartData?.cart?.cart
        ?.filter(
          ({ product_data }: ProductData) => product_data.metadata.type === "merchandiseWithTaxOverride"
        )
        ?.reduce((acc: number, i: any) => acc + i.product_data.metadata.priceWithoutTax, 0) / 100;

    const merchandiseOverriddenTaxAmount =
      customerCartData?.cart?.cart
        ?.filter(
          ({ product_data }: ProductData) => product_data.metadata.type === "merchandiseWithTaxOverride"
        )
        ?.reduce((acc: number, i: any) => acc + i.product_data.metadata.taxAmount, 0) / 100;

    const charityId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "charity"
    )?.product_data.metadata.charity_id;

    const weatherQuoteId = customerCartData?.cart?.cart?.find(
      ({ product_data }: ProductData) => product_data.metadata.type === "sensible"
    )?.product_data.metadata.sensible_quote_id;

    const taxes = taxCharge + sensibleCharge + charityCharge + convenienceCharge;
    const skipItemsForTotal = [
      "markup",
      "cart_fee",
      "greenFeeTaxPercent",
      "cartFeeTaxPercent",
      "weatherGuaranteeTaxPercent",
      "markupTaxPercent",
      "merchandiseTaxPercent",
    ];
    const total = customerCartData?.cart?.cart
      .filter(({ product_data }: ProductData) => {
        return !skipItemsForTotal.includes(product_data.metadata.type);
      })
      .reduce((acc: number, i: any) => {
        return acc + i.price;
      }, 0);

    return {
      ...primaryData,
      cart: customerCartData.cart as CustomerCart,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      taxes,
      markupCharge,
      total,
      cartId: customerCartData?.cartId,
      charityId,
      weatherQuoteId,
      paymentId: customerCartData.paymentId,
      cartFeeCharge: cartFeeCharge,
      merchandiseCharge,
      merchandiseWithTaxOverrideCharge,
      merchandiseOverriddenTaxAmount,
    };
  };

  checkIfPaymentIdIsValid = async (paymentId: string) => {
    const hyperswitchEndPoint = `${process.env.HYPERSWITCH_BASE_URL}/payments/${paymentId}`;
    const myHeaders = new Headers();
    myHeaders.append("api-key", process.env.HYPERSWITCH_API_KEY ?? "");
    const requestOptions = {
      method: "GET",
      headers: myHeaders,
    };
    const response = await fetch(hyperswitchEndPoint, requestOptions);
    const paymentData = await response.json();
    if (paymentData.error && paymentData?.error?.type === "invalid_request") {
      return false;
    }
    return true;
  };

  sendMessageToVerifyPayment = async (
    paymentId: string,
    customer_id: string,
    bookingId: string,
    redirectHref: string
  ) => {
    const myHeaders = new Headers();
    myHeaders.append("Authorization", `Bearer ${process.env.QSTASH_TOKEN}`);
    myHeaders.append("Content-Type", "application/json");

    const raw = JSON.stringify({
      json: {
        paymentId,
        customer_id,
        bookingId,
        redirectHref,
      },
    });
    console.log("Sending message to payment queue", {
      paymentId,
      customer_id,
      bookingId,
      redirectHref,
      url: `https://qstash.upstash.io/v2/publish/${process.env.QSTASH_PAYMENT_TOPIC}`,
    });
    const requestOptions: RequestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow",
    };
    try {
      const response = await fetch(
        `https://qstash.upstash.io/v2/publish/${process.env.QSTASH_PAYMENT_TOPIC}`,
        requestOptions
      );
      const data = await response.json();
      return data;
    } catch (e) {
      console.log("Error in addding message", e);
    }
  };

  reserveBooking = async (
    userId: string,
    cartId: string,
    payment_id: string,
    sensibleQuoteId: string,
    source: string,
    additionalNoteFromUser: string | undefined,
    needRentals: boolean,
    redirectHref: string,
    courseMembershipId: string,
    playerCountForMemberShip: string,
    providerCourseMembershipId: string
  ) => {
    let bookingStage = "Normalizing Cart Data";
    const {
      cart,
      playerCount,
      primaryGreenFeeCharge,
      teeTimeId,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      markupCharge,
      taxes,
      total,
      charityId,
      weatherQuoteId,
      paymentId,
      cartFeeCharge,
      merchandiseCharge,
      merchandiseWithTaxOverrideCharge,
      merchandiseOverriddenTaxAmount,
    } = await this.normalizeCartData({
      cartId,
      userId,
    });
    bookingStage = "Checking if payment id is valid";
    console.log(`Check if payment id is valid ${payment_id}`);
    const isValid = await this.checkIfPaymentIdIsValid(payment_id);
    if (!isValid) {
      throw new Error("Payment Id not is not valid");
    }
    if (!weatherQuoteId) {
      bookingStage = "Cancelling sensible quote Because it is not valid";
      console.log("Cancel Sensible Quote ID : ", sensibleQuoteId);
      this.sensibleService.cancelQuote(sensibleQuoteId);
    }

    bookingStage = "Checking if booking is already done";
    const [bookedAlready] = await this.database
      .select({
        id: bookings.id,
      })
      .from(bookings)
      .where(eq(bookings.providerPaymentId, payment_id));

    if (bookedAlready) {
      throw new Error("Booking already done");
    }

    // const pricePerGolfer = primaryGreenFeeCharge / playerCount;
    const pricePerGolfer = playerCount !== 0 ? primaryGreenFeeCharge / playerCount : 0;

    bookingStage = "Retrieving tee time from database";
    console.log(`Retrieving tee time from database ${teeTimeId}`);

    // let teeTime: any = await cacheManager.get(`teeTime:${teeTimeId}`);
    // if (!teeTime) {
    const tempTeeTimes = await this.database
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
        providerDate: teeTimes.providerDate,
        holes: teeTimes.numberOfHoles,
        cdnKey: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        courseName: courses.name,
        entityName: entities.name,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
        isWebhookAvailable: providers.isWebhookAvailable,
        timeZoneCorrection: courses.timezoneCorrection,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        greenFees: teeTimes.greenFeePerPlayer,
        cartFees: teeTimes.cartFeePerPlayer,
        greenFeeTaxPercent: courses.greenFeeTaxPercent,
        cartFeeTaxPercent: courses.cartFeeTaxPercent,
        weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
        markupTaxPercent: courses.markupTaxPercent,
        timezoneCorrection: courses.timezoneCorrection,
        merchandiseTaxPercent: courses.merchandiseTaxPercent,
      })
      .from(teeTimes)
      .leftJoin(courses, eq(teeTimes.courseId, courses.id))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(entities, eq(courses.entityId, entities.id))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      //.leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(eq(teeTimes.id, teeTimeId as string))
      .execute()
      .catch((err) => {
        this.logger.error(`Error finding tee time id ${teeTimeId}: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "ERROR_FINDING_TEE_TIME_ID",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeId,
          }),
        });
        throw new Error(`Error finding tee time id`);
      });

    const [customerDetails] = await this.database
      .select({
        userEmail: users.email,
        userName: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error finding user with id ${userId}: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "ERROR_FINDING_USER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeId,
          }),
        });
        throw new Error(`Error finding user by id`);
      });

    //   await cacheManager.set(`teeTime:${teeTimeId}`, teeTime); // Cache for 1 hour
    // }

    const teeTime = tempTeeTimes[0];

    // Calculate additional taxes

    const greenFeeTaxTotal =
      ((teeTime?.greenFees ?? 0) / 100) * ((teeTime?.greenFeeTaxPercent ?? 0) / 100 / 100) * playerCount;
    const markupTaxTotal = (markupCharge / 100) * ((teeTime?.markupTaxPercent ?? 0) / 100) * playerCount;
    const weatherGuaranteeTaxTotal =
      (sensibleCharge / 100) * ((teeTime?.weatherGuaranteeTaxPercent ?? 0) / 100);
    const cartFeeTaxPercentTotal =
      (((cartFeeCharge / 100) * ((teeTime?.cartFeeTaxPercent ?? 0) / 100)) / 100) * playerCount;
    const merchandiseTaxTotal = (merchandiseCharge / 100) * ((teeTime?.merchandiseTaxPercent ?? 0) / 100);

    const additionalTaxes =
      greenFeeTaxTotal +
      markupTaxTotal +
      weatherGuaranteeTaxTotal +
      cartFeeTaxPercentTotal +
      merchandiseTaxTotal;
    const merchandiseTotalCharge = merchandiseCharge + merchandiseWithTaxOverrideCharge;

    if (!teeTime) {
      this.logger.fatal(`tee time not found id: ${teeTimeId}`);
      loggerService.errorLog({
        userId: userId,
        url: "/reserveBooking",
        userAgent: "",
        message: "ERROR_FINDING_TEE_TIME_ID",
        stackTrace: `tee time not found id: ${teeTimeId}`,
        additionalDetailsJSON: JSON.stringify({
          userId,
          teeTimeId,
        }),
      });
      throw new Error(`Error finding tee time id`);
    }

    bookingStage = "Retrieving provider and token";
    console.log(`Retrieving provider and token ${teeTime.internalId}, ${teeTime.courseId}`);
    let booking: BookingResponse | null = null;
    let purchasedMerchandise: MerchandiseItem[] = [];
    let teeProvider: ProviderAPI | null = null;
    let teeToken: string | null = null;
    const bookedPLayers: { accountNumber: number }[] = [];
    let bookingData;
    let providerBookingId = "";
    let providerBookingIds: string[] = [];
    try {
      const { provider, token } = await this.providerService.getProviderAndKey(
        teeTime.internalId!,
        teeTime.courseId,
        teeTime.providerCourseConfiguration!
      );
      teeProvider = provider;
      teeToken = token;
      bookingStage = "Finding or creating customer";
      console.log(
        `Finding or creating customer ${userId}, ${teeTime.courseId}, ${teeTime.providerId}, ${teeTime.providerCourseId}, ${token}`
      );

      const providerCustomer = await this.providerService.findOrCreateCustomer(
        teeTime.courseId,
        teeTime.providerId ?? "",
        teeTime.providerCourseId!,
        userId,
        provider,
        token
      );
      let details = await appSettingService.get("TEE_SHEET_BOOKING_MESSAGE");
      try {
        const isSensibleNoteAvailable = await appSettingService.get("SENSIBLE_NOTE_TO_TEE_SHEET");
        if (weatherQuoteId && isSensibleNoteAvailable) {
          details = `${details}: ${isSensibleNoteAvailable}`;
        }
      } catch (e) {
        console.log("ERROR in getting appsetting SENSIBLE_NOTE_TO_TEE_SHEET");
      }

      if (merchandiseTotalCharge > 0) {
        details = `${details} - Merchandise has been purchased`;
      }

      if (additionalNoteFromUser) {
        details = `${details}\n${additionalNoteFromUser}`;
      } else {
        details = `${details}`;
      }

      bookingStage = "Getting booking Creation Data";
      const bookingData = provider.getBookingCreationData({
        firstHandCharge: primaryGreenFeeCharge,
        markupCharge,
        taxCharge,
        playerCount: courseMembershipId ? playerCountForMemberShip : playerCount,
        holes: teeTime.holes,
        notes: details,
        teeTimeId: teeTime.id,
        providerTeeTimeId: teeTime.providerTeeTimeId,
        startTime: teeTime.providerDate,
        greenFees: teeTime.greenFees / 100,
        cartFees: teeTime.cartFees / 100,
        providerCustomerId: providerCustomer.customerId?.toString() ?? null,
        providerAccountNumber: providerCustomer.playerNumber,
        totalAmountPaid: primaryGreenFeeCharge / 100 + taxCharge - markupCharge,
        name: providerCustomer.name,
        email: providerCustomer.email,
        phone: providerCustomer.phone,
        providerCourseId: teeTime.providerCourseId,
      });
      bookingStage = "Creating Booking on Provider";
      booking = await provider
        .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, bookingData, userId)
        .catch((err) => {
          this.logger.error(`first hand booking at provider failed for teetime ${teeTime.id}: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/reserveBooking",
            userAgent: "",
            message: "TEE TIME BOOKING FAILED ON PROVIDER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: `first hand booking at provider failed for teetime ${teeTime.id}`,
          });
          throw new Error(`Error creating booking`);
        });
      // }
      if (provider.shouldAddSaleData()) {
        bookingStage = "Adding Sales Data";
        try {
          console.log("Amounts: ", primaryGreenFeeCharge / 100, taxCharge, markupCharge);
          const bookingsDetails: BookingDetails = {
            playerCount: courseMembershipId ? playerCountForMemberShip : playerCount,
            providerCourseId: teeTime.providerCourseId!,
            providerTeeSheetId: teeTime.providerTeeSheetId!,
            totalAmountPaid: (pricePerGolfer / 100 + taxCharge - markupCharge) * playerCount,
            greenFeeCharge: teeTime.greenFees / 100,
            cartFeeCharge: teeTime.cartFees / 100,
            token: token,
          };
          const addSalesOptions = provider.getSalesDataOptions(booking, bookingsDetails);
          await provider.addSalesData(addSalesOptions);
        } catch (error: any) {
          this.logger.error(`Error adding sales data, ${JSON.stringify(error.message)}`);
          loggerService.errorLog({
            userId: userId,
            url: "/reserveBooking",
            userAgent: "",
            message: "ERROR_ADDING_SALES_DATA",
            stackTrace: `${JSON.stringify(error)}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeId,
              error,
              booking: JSON.stringify(booking),
            }),
          });
        }
      }
      if (additionalNoteFromUser || needRentals || merchandiseTotalCharge > 0) {
        const merchandiseDetails: { caption: string; qty: number }[] = [];
        const merchandiseData = cart?.cart?.filter(
          (item: ProductData) => item.product_data.metadata.type === "merchandise"
        ) as MerchandiseProduct[];
        const merchandiseItems = merchandiseData[0]!.product_data.metadata.merchandiseItems ?? [];
        const merchandiseItemIds = merchandiseItems.map((item) => item.id);
        const merchandiseWithTaxOverrideData = cart?.cart?.filter(
          (item: ProductData) => item.product_data.metadata.type === "merchandiseWithTaxOverride"
        ) as MerchandiseWithTaxOverride[];
        const merchandiseWithTaxOverrideItems =
          merchandiseWithTaxOverrideData[0]?.product_data.metadata.merchandiseItems ?? [];
        merchandiseItemIds.push(...merchandiseWithTaxOverrideItems.map((item) => item.id));
        purchasedMerchandise = await db
          .select({
            id: courseMerchandise.id,
            caption: courseMerchandise.caption,
            qoh: courseMerchandise.qoh,
          })
          .from(courseMerchandise)
          .where(inArray(courseMerchandise.id, merchandiseItemIds))
          .execute()
          .catch((error) => {
            void loggerService.errorLog({
              userId: userId,
              url: "/TokenizeService/tokenizeBooking",
              userAgent: "",
              message: "COURSE MERCHANDISE ERROR",
              stackTrace: `${error.stack}`,
              additionalDetailsJSON: `${JSON.stringify({
                merchandiseItemIds,
                merchandiseItems,
                merchandiseData,
                cart,
              })}`,
            });
            throw error;
          });
        for (const merchandise of purchasedMerchandise) {
          const merchandiseItem = merchandiseItems.find((item) => item.id === merchandise.id);
          merchandiseDetails.push({
            caption: merchandise.caption,
            qty: merchandiseItem?.qty ?? 0,
          });
        }

        const courseContactsList = await this.database
          .select({
            email: courseContacts.email,
            phone: courseContacts.phone1,
          })
          .from(courseContacts)
          .where(
            and(eq(courseContacts.courseId, teeTime.courseId), eq(courseContacts.sendNotification, true))
          )
          .execute()
          .catch((err) => {
            this.logger.error(`Error getting course contacts list, ${JSON.stringify(err.message)}`);
            loggerService.errorLog({
              userId: userId,
              url: "/reserveBooking",
              userAgent: "",
              message: "ERROR_GETTING_COURSE_CONTACTS_LIST",
              stackTrace: `${JSON.stringify(err)}`,
              additionalDetailsJSON: JSON.stringify({
                userId,
                teeTimeId,
                error: err,
              }),
            });
            return [];
          });

        const [user] = await this.database.select().from(users).where(eq(users.id, userId)).execute();
        const emailList = courseContactsList.map((contact) => contact.email);
        if (emailList.length > 0) {
          emailList.map(async (email) => {
            await this.notificationService.sendEmailByTemplate(
              email,
              "Reservation Additional Request",
              process.env.SENDGRID_COURSE_CONTACT_NOTIFICATION_TEMPLATE_ID!,
              {
                EMail: user?.email ?? "",
                CustomerName: user?.name ?? "",
                NoteFromUser: additionalNoteFromUser || "-",
                NeedRentals: needRentals ? "Yes" : "No",
                PlayDateTime: formatTime(teeTime.providerDate, true, teeTime.timezoneCorrection ?? 0),
                HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
                CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.cdnKey}.${teeTime.extension}`,
                PurchasedMerchandise: purchasedMerchandise?.length > 0 ? true : false,
                MerchandiseDetails: merchandiseDetails,
              },
              []
            );
          });
        }
      }
    } catch (e) {
      console.log("BOOKING FAILED ON PROVIDER, INITIATING REFUND FOR PAYMENT_ID", payment_id);
      this.hyperSwitchService.sendEmailForBookingFailed(
        paymentId,
        teeTime.courseId,
        cartId,
        sensibleQuoteId,
        userId,
        bookingStage,
        teeTimeId,
        {
          userName: customerDetails?.userName ?? "",
          userEmail: customerDetails?.userEmail ?? "",
          courseName: teeTime.courseName ?? "",
          teeTimeDate: teeTime.providerDate,
        }
      );
      throw "Booking failed on provider";
      // await this.hyperSwitchService.refundPayment(payment_id);
      // const [user] = await this.database.select().from(users).where(eq(users.id, userId));
      // if (!user) {
      //   this.logger.warn(`User not found: ${userId}`);
      //   throw new Error("User not found");
      // }
      // const template = {
      //   CustomerFirstName: user?.handle ?? user.name ?? "",
      //   CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime?.cdnKey}.${teeTime?.extension}`,
      //   CourseURL: teeTime?.websiteURL || "",
      //   CourseName: teeTime?.courseName || "-",
      //   FacilityName: teeTime?.entityName || "-",
      //   PlayDateTime:
      //     dayjs(teeTime?.providerDate)
      //       .utcOffset(teeTime.timeZoneCorrection || "-06:00")
      //       .format("MM/DD/YYYY h:mm A") || "-",
      //   HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
      // };
      // await this.notificationService.createNotification(
      //   userId || "",
      //   "Refund Initiated",
      //   "Refund Initiated",
      //   teeTime?.courseId,
      //   process.env.SENDGRID_REFUND_EMAIL_TEMPLATE_ID ?? "d-79ca4be6569940cdb19dd2b607c17221",
      //   template
      // );
      // loggerService.auditLog({
      //   id: randomUUID(),
      //   userId,
      //   teeTimeId,
      //   bookingId: "",
      //   listingId: "",
      //   courseId: teeTime?.courseId,
      //   eventId: "REFUND_INITIATED",
      //   json: `{paymentId:${payment_id}}`,
      // });
    }
    providerBookingIds = teeProvider.getSlotIdsFromBooking(booking);
    providerBookingId = teeProvider.getBookingId(booking);
    if (!providerBookingId) {
      this.logger.error(`No booking id found in response from provider: ${JSON.stringify(booking)}`);
      throw new Error("No booking id found in response from provider");
    }
    console.log(`Creating tokenized booking`);
    const bookingId = await this.tokenizeService
      .tokenizeBooking({
        redirectHref,
        userId,
        purchasePrice: pricePerGolfer,
        players: playerCount as number,
        providerBookingId,
        providerTeeTimeId: teeTimeId as string,
        paymentId: paymentId as string,
        withCart: true,
        provider: teeProvider,
        token: teeToken,
        teeTime,
        normalizedCartData: {
          cart,
          primaryGreenFeeCharge,
          taxCharge,
          sensibleCharge,
          convenienceCharge,
          charityCharge,
          taxes,
          total,
          charityId,
          weatherQuoteId,
          cartId,
          markupCharge,
          merchandiseCharge: merchandiseTotalCharge,
        },
        isWebhookAvailable: teeTime?.isWebhookAvailable ?? false,
        providerBookingIds,
        cartFeeCharge: cartFeeCharge,
        additionalTaxes: {
          greenFeeTaxTotal,
          markupTaxTotal,
          weatherGuaranteeTaxTotal,
          cartFeeTaxPercentTotal,
          additionalTaxes,
          merchandiseTaxTotal: merchandiseTaxTotal + merchandiseOverriddenTaxAmount,
        },
        source,
        additionalNoteFromUser,
        needRentals,
        courseMembershipId: courseMembershipId,
        playerCountForMemberShip,
        purchasedMerchandise,
      })
      .catch(async (err) => {
        this.logger.error(`Error creating booking, ${err}`);
        //@TODO this email should be removed
        await this.notificationService.createNotification(
          userId,
          "Error creating booking",
          "An error occurred while creating booking with provider",
          teeTime.courseId
        );
        loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "TEE TIME BOOKING FAILED ON GOLF DISTRIC",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: `first hand booking at provider failed for teetime ${teeTime.id}`,
        });
        throw new Error(`Error creating booking`);
      });

    await this.sendMessageToVerifyPayment(paymentId as string, userId, bookingId.bookingId, redirectHref);
    return {
      bookingId: bookingId.bookingId,
      providerBookingId,
      status: "Reserved",
      isEmailSend: bookingId.isEmailSend,
      isValidForCollectPayment: bookingId?.validForCollectPayment,
    } as ReserveTeeTimeResponse;
  };

  confirmBooking = async (paymentId: string, userId: string) => {
    const bookingItems = await this.database
      .select({
        bookingId: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
      })
      .from(bookings)
      .innerJoin(customerCarts, eq(bookings.cartId, customerCarts.id))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))

      // .leftJoin(courses, eq(customerCarts.courseId, courses.id))
      .where(and(eq(customerCarts.paymentId, paymentId), eq(bookings.ownerId, userId)))
      .execute()
      .catch((err) => {
        loggerService.auditLog({
          id: randomUUID(),
          userId,
          teeTimeId: "",
          bookingId: "",
          listingId: "",
          courseId: "",
          eventId: "TEE_TIME_CONFIRMATION_FAILED",
          json: JSON.stringify({
            err,
            paymentId,
          }),
        });
        this.logger.error(`Error retrieving bookings by payment id: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/confirmBooking",
          userAgent: "",
          message: "ERROR CONFIRMING BOOKING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: `error confirming booking with payment ID: ${paymentId}
          }`,
        });
        throw "Error retrieving booking";
      });
    if (!bookingItems) {
      console.log(`Booking not found for payment id ${paymentId}`);
      loggerService.errorLog({
        userId: userId,
        url: "/confirmBooking",
        userAgent: "",
        message: "BOOKING_NOT_FOUND",
        stackTrace: `booking not found for payment id ${paymentId}`,
        additionalDetailsJSON: JSON.stringify({ paymentId }),
      });
      throw "Booking not found for payment id";
    } else {
      console.log(`CURRENT BOOKINGS: ${bookingItems.length}`);
      for (const booking of bookingItems) {
        console.log("Set confirm status on booking id ", booking.bookingId);
        await this.database
          .update(bookings)
          .set({
            status: "CONFIRMED",
          })
          .where(eq(bookings.id, booking.bookingId))
          .execute()
          .catch((err) => {
            this.logger.error(`Error in updating booking status ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/confirmBooking",
              userAgent: "",
              message: "ERROR CONFIRMING BOOKING",
              stackTrace: `error confirming booking id ${booking?.bookingId ?? ""} teetime ${
                booking?.teeTimeId ?? ""
              }`,
              additionalDetailsJSON: err,
            });
          });

        loggerService.auditLog({
          id: randomUUID(),
          userId,
          teeTimeId: booking?.teeTimeId ?? "",
          bookingId: booking?.bookingId ?? "",
          listingId: "",
          courseId: booking?.courseId ?? "",
          eventId: "BOOKING_CONFIRMED",
          json: "Bookimg status confirmed",
        });
      }
    }
  };

  checkCancelledBookingFromProvider = async (listingId: string, userId: string) => {
    try {
      const [bookingResult] = await this.database
        .select({
          bookingTeeTimeId: bookings.teeTimeId,
          bookingProviderId: bookings.providerBookingId,
          courseId: teeTimes.courseId,
          providerId: providerCourseLink.providerId,
          providerCourseId: providerCourseLink.providerCourseId,
          providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
          providerInternalId: providers.internalId,
          providerTeeSheet: providerCourseLink.providerTeeSheetId,
          providerDate: teeTimes.providerDate,
          courseName: courses.name,
          userName: users.name,
          userEmail: users.email,
        })
        .from(bookings)
        .leftJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
        .leftJoin(providerCourseLink, eq(teeTimes.courseId, providerCourseLink.courseId))
        .leftJoin(providers, eq(providerCourseLink.providerId, providers.id))
        .leftJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(users, eq(bookings.ownerId, users.id))
        .where(eq(bookings.listId, listingId));
      const result = await this.providerService.checkCancelledBooking(
        bookingResult?.bookingProviderId!,
        bookingResult?.providerTeeSheet!,
        bookingResult?.providerCourseId!,
        bookingResult?.providerInternalId!,
        bookingResult?.courseId!,
        bookingResult?.providerCourseConfiguration!
      );
      if (result) {
        loggerService.auditLog({
          id: randomUUID(),
          userId,
          teeTimeId: bookingResult?.bookingTeeTimeId ?? "",
          bookingId: bookingResult?.bookingProviderId ?? "",
          listingId: listingId,
          courseId: bookingResult?.courseId ?? "",
          eventId: "TEE_TIME_DELETED_BY_PROVIDER_LISTED_IN_COURSE",
          json: "TEE_TIME_DELETED_BY_PROVIDER",
        });
        const adminEmail: string = process.env.ADMIN_EMAIL_LIST || "nara@golfdistrict.com";
        const emailAfterSplit = adminEmail.split(",");
        emailAfterSplit.map(async (email) => {
          await this.notificationService.sendEmail(
            email,
            "TEE_TIME_DELETED_BY_PROVIDER_LISTED_IN_COURSE",
            `
            The customer attempted to purchase a tee time, but the provider canceled it. The following details pertain to the canceled tee time:
            Tee Time ID ====> ${bookingResult?.bookingTeeTimeId} ,
            Tee Time Date ====> ${bookingResult?.providerDate} ,
           Provider Booking ID ====> ${bookingResult?.bookingProviderId} ,
           Course ID ====> ${bookingResult?.courseId},
           Course Name ====> ${bookingResult?.courseName},
           Listing ID ====> ${listingId},
           Customer Name ====> ${bookingResult?.userName},
           Customer Email ====> ${bookingResult?.userEmail},
           This information indicates that the tee time was listed in the course but was subsequently deleted by the provider.
            `
          );
        });
        return { providerBookingStatus: result };
      } else {
        return { providerBookingStatus: result };
      }
    } catch (error: any) {
      await loggerService.errorLog({
        message: error.message,
        userId: "",
        url: "/bookingProvideStatus",
        userAgent: "",
        stackTrace: `${error}`,
        additionalDetailsJSON: JSON.stringify({ error: error.message }),
      });
    }
  };

  reserveSecondHandBooking = async (
    userId = "",
    cartId = "",
    listingId = "",
    payment_id = "",
    source = "",
    additionalNoteFromUser = "",
    needRentals = false,
    redirectHref = ""
  ) => {
    const {
      cart,
      playerCount,
      primaryGreenFeeCharge,
      teeTimeId,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      taxes,
      total,
      charityId,
      weatherQuoteId,
      paymentId,
      cartFeeCharge,
    } = await this.normalizeCartData({
      cartId,
      userId,
    });

    const isValid = await this.checkIfPaymentIdIsValid(payment_id);
    if (!isValid) {
      loggerService.auditLog({
        id: randomUUID(),
        userId,
        teeTimeId: "",
        bookingId: "",
        listingId,
        courseId: cart?.courseId ?? "",
        eventId: "PAYMENT_ID_NOT_VALID",
        json: "Payment Id not is not valid",
      });
      throw new Error("Payment Id not is not valid");
    }
    const [associatedBooking] = await this.database
      .select({
        id: bookings.id,
        includesCart: bookings.includesCart,
        numberOfHoles: bookings.numberOfHoles,
        weatherGuaranteeAmount: bookings.weatherGuaranteeAmount,
        weatherGuaranteeId: bookings.weatherGuaranteeId,
        ownerId: bookings.ownerId,
        listedSlotsCount: lists.slots,
        listPrice: lists.listPrice,
        teeTimeIdForBooking: bookings.teeTimeId,
        isListed: bookings.isListed,
        allowSplit: lists.allowSplit,
      })
      .from(bookings)
      .leftJoin(lists, eq(lists.id, listingId))
      .where(eq(bookings.listId, listingId))
      .execute();

    if (!associatedBooking?.isListed) {
      throw new Error("Sorry the tee time is not listed anymore");
    }

    const [userData] = await this.database
      .select({
        handle: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const bookingId = randomUUID();
    const bookingsToCreate: InsertBooking[] = [];
    const transfersToCreate: InsertTransfer[] = [];
    const bookedPlayers = associatedBooking?.allowSplit
      ? playerCount
      : associatedBooking?.listedSlotsCount ?? 0;

    bookingsToCreate.push({
      id: bookingId,
      // purchasedAt: currentUtcTimestamp(),
      providerBookingId: "",
      isListed: false,
      numberOfHoles: associatedBooking?.numberOfHoles,
      minimumOfferPrice: 0,
      ownerId: userId,
      teeTimeId: associatedBooking?.teeTimeIdForBooking ?? "",
      nameOnBooking: userData?.handle ?? "",
      includesCart: associatedBooking?.includesCart,
      listId: null,
      weatherGuaranteeAmount: sensibleCharge * 100,
      weatherGuaranteeId: "",
      cartId: cartId,
      playerCount: bookedPlayers,
      greenFeePerPlayer: primaryGreenFeeCharge / (bookedPlayers ?? 1) ?? 0,
      totalTaxesAmount: taxCharge * 100 || 0,
      charityId: charityId || null,
      totalCharityAmount: charityCharge * 100 || 0,
      totalAmount: total || 0,
      providerPaymentId: paymentId,
      markupFees: 0,
      weatherQuoteId: weatherQuoteId || null,
      cartFeePerPlayer: cartFeeCharge,
      source: source ? source : null,
      customerComment: additionalNoteFromUser,
      needClubRental: needRentals,
    });
    transfersToCreate.push({
      id: randomUUID(),
      amount: associatedBooking?.listPrice ?? 0,
      bookingId: bookingId,
      transactionId: randomUUID(),
      fromUserId: associatedBooking?.ownerId ?? "",
      toUserId: userId,
      courseId: cart?.courseId,
      fromBookingId: associatedBooking?.id,
      weatherGuaranteeId: associatedBooking.weatherGuaranteeId ?? "",
      weatherGuaranteeAmount: associatedBooking.weatherGuaranteeAmount ?? 0,
    });
    await this.database.transaction(async (tx) => {
      await tx
        .insert(bookings)
        .values(bookingsToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(`Error creating booking ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/reserveSecondHandBooking",
            userAgent: "",
            message: "ERROR_CREATING_BOOKING",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeId,
              bookingsToCreate,
            }),
          });
          tx.rollback();
        });

      await this.database
        .insert(transfers)
        .values(transfersToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(`Error creating transfer ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/reserveSecondHandBooking",
            userAgent: "",
            message: "ERROR_CREATING_TRANSFER",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeId,
              transfersToCreate,
            }),
          });
        });
    });
    await this.sendMessageToVerifyPayment(payment_id, userId, bookingId, redirectHref);

    loggerService.auditLog({
      id: randomUUID(),
      userId,
      teeTimeId: associatedBooking?.teeTimeIdForBooking ?? "",
      bookingId,
      listingId,
      courseId: cart?.courseId ?? "",
      eventId: "TEE_TIME_BOOKED",
      json: "Tee time booked",
    });
    //Sending teetime purchase email to user
    // const pricePerBooking = ((Math.round(total) / 100) / (associatedBooking?.listedSlotsCount ?? 0));
    // const message = `
    // A total of $${(Math.round(total) / 100)} tee times have been purchased.

    // - **Number of Players:** ${associatedBooking?.listedSlotsCount ?? 0}
    // - **Price per Booking:** ${pricePerBooking ?? "Not specified"}
    // - **Booking ID:** ${bookingId ?? "Unavailable"}

    // This purchase was made as a second-party transaction directly from the course.
    // `;
    // let isEmailSend = false;
    // const attachment: any[] = [];
    // try {
    //   await this.notificationService.createNotification(
    //     userId,
    //     "TeeTimes Purchased",
    //     message,
    //     "",
    //     process.env.SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID,
    //     undefined,
    //     attachment
    //   );
    // } catch (error: any) {
    //   console.log(error.message);
    //   isEmailSend = true;
    //   this.logger.error(error);
    //   loggerService.errorLog({
    //     userId: userId,
    //     url: "/reserveBooking",
    //     userAgent: "",
    //     message: "EMAIL_SEND_FAILED_AFTER_TEETIME_PURCHASE",
    //     stackTrace: `${error.stack}`,
    //     additionalDetailsJSON: JSON.stringify({
    //       bookingId: bookingId,
    //       teeTimeID: associatedBooking?.teeTimeIdForBooking,
    //     }),
    //   });
    // }
    return {
      bookingId,
      providerBookingId: "",
      status: "Reserved",
      isEmailSend: false,
    } as ReserveTeeTimeResponse;
  };

  getOwnedBookingById = async (userId: string, bookingId: string) => {
    const [booking] = await this.database
      .select({
        providerId: bookings.providerBookingId,
        playTime: teeTimes.providerDate,
        transferedFromBookingId: transfers.fromUserId,
        groupId: bookings.groupId,
        playerCount: bookings.playerCount,
        courseId: teeTimes.courseId,
      })
      .from(bookings)
      .innerJoin(transfers, eq(transfers.bookingId, bookings.id))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(and(eq(bookings.ownerId, userId), eq(bookings.id, bookingId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings by payment id: ${err}`);
        loggerService.errorLog({
          userId,
          url: "/getOwnedBookingById",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            bookingId,
          }),
        });
        throw "Error retrieving booking";
      });
    let playerCount = 0;
    if (booking?.groupId) {
      //need to count how many players are in the group via playerCount on bookings table
      const groupBookings = await this.database
        .select({
          playerCount: bookings.playerCount,
        })
        .from(bookings)
        .where(eq(bookings.groupId, booking.groupId))
        .execute();

      for (const groupBooking of groupBookings) {
        playerCount += groupBooking.playerCount;
      }
    }
    if (booking && booking?.transferedFromBookingId !== "0x000") {
      booking.providerId = "";
    }

    return { ...booking, playerCount: playerCount || booking?.playerCount };
  };

  checkIfTeeTimeAvailableOnProvider = async (teeTimeId: string, golfersCount: number, userId: string) => {
    const cacheKey = `teeTimeData:${teeTimeId}`;
    const cacheTTL = 600; // Cache TTL in seconds
    let teeTime: any = await cacheManager.get(cacheKey);

    if (!teeTime) {
      // Fetch tee time data from the database if not in cache
      const [teeTimeData] = await this.database
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          time: teeTimes.time,
          entityId: courses.entityId,
          date: teeTimes.date,
          availableFirstHandSpots: teeTimes.availableFirstHandSpots,
          providerCourseId: providerCourseLink.providerCourseId,
          providerTeeSheetId: providerCourseLink.providerTeeSheetId,
          providerId: providerCourseLink.providerId,
          internalId: providers.internalId,
          providerDate: teeTimes.providerDate,
          holes: teeTimes.numberOfHoles,
          cdnKey: assets.key,
          extension: assets.extension,
          websiteURL: courses.websiteURL,
          courseName: courses.name,
          entityName: entities.name,
          isWebhookAvailable: providers.isWebhookAvailable,
          timeZoneCorrection: courses.timezoneCorrection,
          providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
          providerTeeTimeId: teeTimes.providerTeeTimeId,
          greenFees: teeTimes.greenFeePerPlayer,
          cartFees: teeTimes.cartFeePerPlayer,
          greenFeeTaxPercent: courses.greenFeeTaxPercent,
          cartFeeTaxPercent: courses.cartFeeTaxPercent,
          weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
          markupTaxPercent: courses.markupTaxPercent,
        })
        .from(teeTimes)
        .leftJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .leftJoin(entities, eq(courses.entityId, entities.id))
        .leftJoin(
          providerCourseLink,
          and(
            eq(providerCourseLink.courseId, teeTimes.courseId),
            eq(providerCourseLink.providerId, courses.providerId)
          )
        )
        .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
        .where(eq(teeTimes.id, teeTimeId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error finding tee time id: ${err}`);
          loggerService.errorLog({
            userId,
            url: "/checkIfTeeTimeAvailableOnProvider",
            userAgent: "",
            message: "ERROR_CHECKING_TEE_TIME_AVAILABILITY",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeId,
            }),
          });
          throw new Error(`Error finding tee time id`);
        });

      if (!teeTimeData) {
        this.logger.fatal(`tee time not found id: ${teeTimeId}`);
        loggerService.errorLog({
          userId,
          url: "/checkIfTeeTimeAvailableOnProvider",
          userAgent: "",
          message: "TEE_TIME_NOT_FOUND",
          stackTrace: `tee time not found id: ${teeTimeId}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeId,
          }),
        });
        throw new Error(`Error finding tee time id`);
      }

      // Cache the fetched tee time data
      teeTime = teeTimeData;
      await cacheManager.set(cacheKey, teeTime, cacheTTL);
    }

    if (teeTime.availableFirstHandSpots >= golfersCount) {
      const { provider, token } = await this.providerService.getProviderAndKey(
        teeTime.internalId!,
        teeTime.courseId,
        teeTime.providerCourseConfiguration!
      );
      const providerDetailsGetTeeTime = await provider.getTeeTimes(
        token,
        teeTime.providerCourseId ?? "",
        teeTime.providerTeeSheetId!,
        `${teeTime.time}`.length === 3 ? `0${teeTime.time}` : `${teeTime.time}`,
        `${teeTime.time + 1}`.length === 3 ? `0${teeTime.time + 1}` : `${teeTime.time + 1}`,
        teeTime.providerDate.split("T")[0] ?? ""
      );
      if (providerDetailsGetTeeTime?.length) {
        const teeTimeData = provider.findTeeTimeById(teeTime.providerTeeTimeId, providerDetailsGetTeeTime);

        if (teeTimeData && provider.getAvailableSpotsOnTeeTime(teeTimeData) >= golfersCount) {
          return true;
        }
      }
    }

    loggerService.errorLog({
      userId: userId,
      url: "/checkIfTeeTimeAvailableOnProvider",
      userAgent: "",
      message: "Tee time already booked",
      stackTrace: `Tee time already booked  teetimeId${teeTimeId} userId:${userId}`,
      additionalDetailsJSON: "",
    });
    return false;
  };

  checkIfTeeTimeGroupAvailableOnProvider = async (
    teeTimeIds: string[],
    golfersCount: number,
    minimumPlayersPerBooking: number,
    userId: string
  ) => {
    const cacheKey = `teeTimeData:${teeTimeIds.toString()}`;
    const cacheTTL = 600; // Cache TTL in seconds
    let teeTimesData: any = await cacheManager.get(cacheKey);

    if (!teeTimesData) {
      // Fetch tee time data from the database if not in cache
      const teeTimeData = await this.database
        .select({
          id: teeTimes.id,
          courseId: teeTimes.courseId,
          time: teeTimes.time,
          availableFirstHandSpots: teeTimes.availableFirstHandSpots,
          providerCourseId: providerCourseLink.providerCourseId,
          providerTeeSheetId: providerCourseLink.providerTeeSheetId,
          internalId: providers.internalId,
          providerDate: teeTimes.providerDate,
          providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
          providerTeeTimeId: teeTimes.providerTeeTimeId,
        })
        .from(teeTimes)
        .leftJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(
          providerCourseLink,
          and(
            eq(providerCourseLink.courseId, teeTimes.courseId),
            eq(providerCourseLink.providerId, courses.providerId)
          )
        )
        .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
        .where(inArray(teeTimes.id, teeTimeIds))
        .orderBy(asc(teeTimes.providerDate))
        .execute()
        .catch((err) => {
          this.logger.error(`Error finding tee time id: ${err}`);
          loggerService.errorLog({
            userId,
            url: "/checkIfTeeTimeAvailableOnProvider",
            userAgent: "",
            message: "ERROR_CHECKING_TEE_TIME_AVAILABILITY",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              teeTimeIds,
            }),
          });
          throw new Error(`Error finding tee time id`);
        });

      if (!teeTimeData) {
        this.logger.fatal(`tee time not found id: ${teeTimeIds.toString()}`);
        loggerService.errorLog({
          userId,
          url: "/checkIfTeeTimeGroupAvailableOnProvider",
          userAgent: "",
          message: "TEE_TIME_NOT_FOUND",
          stackTrace: `tee time not found id: ${teeTimeIds.toString()}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeIds,
          }),
        });
        throw new Error(`Error finding tee time id`);
      }

      // Cache the fetched tee time data
      teeTimesData = teeTimeData;
      await cacheManager.set(cacheKey, teeTimesData, cacheTTL);
    }

    const firstTeeTime = teeTimesData[0];
    const lastTeeTime = teeTimesData[teeTimesData.length - 1];
    const { provider, token } = await this.providerService.getProviderAndKey(
      firstTeeTime.internalId!,
      firstTeeTime.courseId,
      firstTeeTime.providerCourseConfiguration!
    );
    const providerDetailsGetTeeTime = await provider.getTeeTimes(
      token,
      firstTeeTime.providerCourseId ?? "",
      firstTeeTime.providerTeeSheetId!,
      `${firstTeeTime.time}`.length === 3 ? `0${firstTeeTime.time}` : `${firstTeeTime.time}`,
      `${lastTeeTime.time + 1}`.length === 3 ? `0${lastTeeTime.time + 1}` : `${lastTeeTime.time + 1}`,
      firstTeeTime.providerDate.split("T")[0] ?? ""
    );
    if (providerDetailsGetTeeTime?.length) {
      let playerCount = golfersCount;
      for (const teeTime of teeTimesData) {
        const teeTimeData = provider.findTeeTimeById(teeTime.providerTeeTimeId, providerDetailsGetTeeTime);
        if (!teeTimeData) {
          loggerService.errorLog({
            userId: userId,
            url: "/checkIfTeeTimeGroupAvailableOnProvider",
            userAgent: "",
            message: "Tee time already booked couldn't find tee Time",
            stackTrace: `Tee time already booked  teetimeId${teeTimeIds.toString()} userId:${userId}`,
            additionalDetailsJSON: "",
          });
          return false;
        }
        const requiredPlayers = Math.min(playerCount, minimumPlayersPerBooking);
        const availableSpots = provider.getAvailableSpotsOnTeeTime(teeTimeData);

        if (availableSpots < requiredPlayers) {
          loggerService.errorLog({
            userId: userId,
            url: "/checkIfTeeTimeGroupAvailableOnProvider",
            userAgent: "",
            message: "Tee time already booked",
            stackTrace: `Tee time already booked  teetimeId${teeTimeIds.toString()} userId:${userId}`,
            additionalDetailsJSON: "",
          });
          return false;
        }
        playerCount -= requiredPlayers;
      }
    }
    return true;
  };

  checkIfUserIsOptMemberShip = async (userId: string, bookingId: string) => {
    const [canReSellResult] = await this.database
      .select({ canResell: bookings.canResell })
      .from(bookings)
      .where(eq(bookings.id, bookingId ?? ""));
    return canReSellResult?.canResell;
  };

  reserveGroupBooking = async (
    userId: string,
    cartId: string,
    payment_id: string,
    sensibleQuoteId: string,
    source: string,
    additionalNoteFromUser: string | undefined,
    needRentals: boolean,
    redirectHref: string,
    courseMembershipId: string,
    playerCountForMemberShip: string,
    providerCourseMembershipId: string
  ) => {
    let bookingStage = "Normalizing Cart Data";
    const {
      cart,
      playerCount,
      primaryGreenFeeCharge,
      // teeTimeId,
      taxCharge,
      sensibleCharge,
      convenienceCharge,
      charityCharge,
      markupCharge,
      taxes,
      total,
      charityId,
      weatherQuoteId,
      paymentId,
      cartFeeCharge,
      teeTimeIds,
      minPlayersPerBooking,
      merchandiseCharge,
      merchandiseWithTaxOverrideCharge,
      merchandiseOverriddenTaxAmount,
    } = await this.normalizeCartData({
      cartId,
      userId,
    });
    const teeTimeIdsAsString = teeTimeIds.toString();

    bookingStage = "Checking if payment id is valid";
    console.log(`Check if payment id is valid ${payment_id}`);
    const isValid = await this.checkIfPaymentIdIsValid(payment_id);
    if (!isValid) {
      throw new Error("Payment Id not is not valid");
    }
    if (!weatherQuoteId) {
      bookingStage = "Cancelling sensible quote Because it is not valid";
      console.log("Cancel Sensible Quote ID : ", sensibleQuoteId);
      this.sensibleService.cancelQuote(sensibleQuoteId);
    }

    bookingStage = "Checking if booking is already done";
    const [bookedAlready] = await this.database
      .select({
        id: bookings.id,
      })
      .from(bookings)
      .where(eq(bookings.providerPaymentId, payment_id));

    if (bookedAlready) {
      throw new Error("Booking already done");
    }

    // const pricePerGolfer = primaryGreenFeeCharge / playerCount;
    const pricePerGolfer = playerCount !== 0 ? primaryGreenFeeCharge / playerCount : 0;

    bookingStage = "Retrieving tee time from database";
    console.log(`Retrieving tee time from database ${teeTimeIdsAsString}`);

    // let teeTime: any = await cacheManager.get(`teeTime:${teeTimeId}`);
    // if (!teeTime) {
    const tempTeeTimes = await this.database
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
        providerDate: teeTimes.providerDate,
        holes: teeTimes.numberOfHoles,
        cdnKey: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        courseName: courses.name,
        entityName: entities.name,
        providerTeeTimeId: teeTimes.providerTeeTimeId,
        isWebhookAvailable: providers.isWebhookAvailable,
        timeZoneCorrection: courses.timezoneCorrection,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
        greenFees: teeTimes.greenFeePerPlayer,
        cartFees: teeTimes.cartFeePerPlayer,
        greenFeeTaxPercent: courses.greenFeeTaxPercent,
        cartFeeTaxPercent: courses.cartFeeTaxPercent,
        weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
        markupTaxPercent: courses.markupTaxPercent,
        timezoneCorrection: courses.timezoneCorrection,
        firstHandSpotsAvailable: teeTimes.availableFirstHandSpots,
        merchandiseTaxPercent: courses.merchandiseTaxPercent,
      })
      .from(teeTimes)
      .leftJoin(courses, eq(teeTimes.courseId, courses.id))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(entities, eq(courses.entityId, entities.id))
      .leftJoin(
        providerCourseLink,
        and(
          eq(providerCourseLink.courseId, teeTimes.courseId),
          eq(providerCourseLink.providerId, courses.providerId)
        )
      )
      //.leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(providers, eq(providers.id, providerCourseLink.providerId))
      .where(inArray(teeTimes.id, teeTimeIds as string[]))
      .orderBy(asc(teeTimes.providerDate))
      .execute()
      .catch((err) => {
        this.logger.error(`Error finding tee time id ${teeTimeIdsAsString}: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/reserveGroupBooking",
          userAgent: "",
          message: "ERROR_FINDING_TEE_TIME_ID",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeIds,
          }),
        });
        throw new Error(`Error finding tee time id`);
      });

    const [customerDetails] = await this.database
      .select({
        userEmail: users.email,
        userName: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error finding user with id ${userId}: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "ERROR_FINDING_USER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
            teeTimeIds,
          }),
        });
        throw new Error(`Error finding user by id`);
      });

    //   await cacheManager.set(`teeTime:${teeTimeId}`, teeTime); // Cache for 1 hour
    // }

    const firstTeeTime = tempTeeTimes[0];

    // Calculate additional taxes

    const greenFeeTaxTotal =
      ((firstTeeTime?.greenFees ?? 0) / 100) *
      ((firstTeeTime?.greenFeeTaxPercent ?? 0) / 100 / 100) *
      playerCount;
    const markupTaxTotal = (markupCharge / 100) * ((firstTeeTime?.markupTaxPercent ?? 0) / 100) * playerCount;
    const weatherGuaranteeTaxTotal =
      (sensibleCharge / 100) * ((firstTeeTime?.weatherGuaranteeTaxPercent ?? 0) / 100);
    const cartFeeTaxPercentTotal =
      (((cartFeeCharge / 100) * ((firstTeeTime?.cartFeeTaxPercent ?? 0) / 100)) / 100) * playerCount;
    const merchandiseTaxTotal =
      (merchandiseCharge / 100) * ((firstTeeTime?.merchandiseTaxPercent ?? 0) / 100);

    const additionalTaxes =
      greenFeeTaxTotal +
      markupTaxTotal +
      weatherGuaranteeTaxTotal +
      cartFeeTaxPercentTotal +
      merchandiseTaxTotal;
    const merchandiseTotalCharge = merchandiseCharge + merchandiseWithTaxOverrideCharge;

    if (!firstTeeTime) {
      this.logger.fatal(`tee time not found id: ${teeTimeIdsAsString}`);
      loggerService.errorLog({
        userId: userId,
        url: "/reserveGroupBooking",
        userAgent: "",
        message: "ERROR_FINDING_TEE_TIME_ID",
        stackTrace: `tee time not found id: ${teeTimeIdsAsString}`,
        additionalDetailsJSON: JSON.stringify({
          userId,
          teeTimeIds,
        }),
      });
      throw new Error(`Error finding tee time id`);
    }

    bookingStage = "Retrieving provider and token";
    console.log(`Retrieving provider and token ${firstTeeTime.internalId}, ${firstTeeTime.courseId}`);
    const providerBookings: ProviderBooking[] = [];
    let purchasedMerchandise: MerchandiseItem[] = [];
    const teeProvider: ProviderAPI | null = null;
    const teeToken: string | null = null;
    const bookedPLayers: { accountNumber: number }[] = [];
    let bookingData;
    const providerBookingId = "";
    const providerBookingIds: string[] = [];
    let remainingPlayersToBook = playerCount;
    const { provider, token } = await this.providerService.getProviderAndKey(
      firstTeeTime.internalId!,
      firstTeeTime.courseId,
      firstTeeTime.providerCourseConfiguration!
    );
    for (const teeTime of tempTeeTimes) {
      try {
        bookingStage = "Finding or creating customer";
        console.log(
          `Finding or creating customer ${userId}, ${firstTeeTime.courseId}, ${firstTeeTime.providerId}, ${firstTeeTime.providerCourseId}, ${token}`
        );

        //check if the teeTime has valid amount of spots available
        const requiredSpots = Math.min(remainingPlayersToBook as number, minPlayersPerBooking as number);
        if (requiredSpots > teeTime.firstHandSpotsAvailable) {
          loggerService.errorLog({
            userId: userId,
            url: "/reserveGroupBooking",
            userAgent: "",
            message: "Tee time already booked",
            stackTrace: `Tee time already booked  teetimeId${teeTimeIdsAsString} userId:${userId}`,
            additionalDetailsJSON: "",
          });
          throw new Error("Tee time already booked");
        }

        const providerCustomer = await this.providerService.findOrCreateCustomer(
          firstTeeTime.courseId,
          firstTeeTime.providerId ?? "",
          firstTeeTime.providerCourseId!,
          userId,
          provider,
          token
        );
        let details = await appSettingService.get("TEE_SHEET_BOOKING_MESSAGE");
        try {
          const isSensibleNoteAvailable = await appSettingService.get("SENSIBLE_NOTE_TO_TEE_SHEET");
          if (weatherQuoteId && isSensibleNoteAvailable) {
            details = `${details}: ${isSensibleNoteAvailable}`;
          }
        } catch (e) {
          console.log("ERROR in getting appsetting SENSIBLE_NOTE_TO_TEE_SHEET");
        }

        if (merchandiseTotalCharge > 0) {
          details = `${details} - Merchandise has been purchased`;
        }

        if (additionalNoteFromUser) {
          details = `${details}\n${additionalNoteFromUser}`;
        } else {
          details = `${details}`;
        }

        bookingStage = "Getting booking Creation Data";
        const bookingData = provider.getBookingCreationData({
          firstHandCharge: primaryGreenFeeCharge,
          markupCharge,
          taxCharge,
          playerCount: courseMembershipId ? +playerCountForMemberShip : requiredSpots,
          holes: teeTime.holes,
          notes: details,
          teeTimeId: teeTime.id,
          providerTeeTimeId: teeTime.providerTeeTimeId,
          startTime: teeTime.providerDate,
          greenFees: teeTime.greenFees / 100,
          cartFees: teeTime.cartFees / 100,
          providerCustomerId: providerCustomer.customerId?.toString() ?? null,
          providerAccountNumber: providerCustomer.playerNumber,
          totalAmountPaid: primaryGreenFeeCharge / 100 + taxCharge - markupCharge,
          name: providerCustomer.name,
          email: providerCustomer.email,
          phone: providerCustomer.phone,
          providerCourseId: teeTime.providerCourseId,
        });
        bookingStage = "Creating Booking on Provider";
        const booking = await provider
          .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, bookingData, userId)
          .catch((err) => {
            this.logger.error(`first hand booking at provider failed for teetime ${teeTime.id}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/reserveGroupBooking",
              userAgent: "",
              message: "TEE TIME BOOKING FAILED ON PROVIDER",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: `first hand booking at provider failed for teetime ${teeTime.id}`,
            });
            throw new Error(`Error creating booking`);
          });

        if (provider.shouldAddSaleData()) {
          bookingStage = "Adding Sales Data";
          try {
            console.log("Amounts: ", primaryGreenFeeCharge / 100, taxCharge, markupCharge);
            const bookingsDetails: BookingDetails = {
              playerCount: courseMembershipId ? +playerCountForMemberShip : requiredSpots,
              providerCourseId: teeTime.providerCourseId!,
              providerTeeSheetId: teeTime.providerTeeSheetId!,
              totalAmountPaid: (pricePerGolfer / 100 + taxCharge - markupCharge) * requiredSpots,
              greenFeeCharge: teeTime.greenFees / 100,
              cartFeeCharge: teeTime.cartFees / 100,
              token: token,
            };
            const addSalesOptions = provider.getSalesDataOptions(booking, bookingsDetails);
            await provider.addSalesData(addSalesOptions);
          } catch (error: any) {
            this.logger.error(`Error adding sales data, ${JSON.stringify(error.message)}`);
            loggerService.errorLog({
              userId: userId,
              url: "/reserveGroupBooking",
              userAgent: "",
              message: "ERROR_ADDING_SALES_DATA",
              stackTrace: `${JSON.stringify(error)}`,
              additionalDetailsJSON: JSON.stringify({
                userId,
                teeTimeId: teeTime.id,
                error,
                booking: JSON.stringify(booking),
              }),
            });
          }
        }
        if (
          firstTeeTime.id === teeTime.id &&
          (additionalNoteFromUser || needRentals || merchandiseTotalCharge > 0)
        ) {
          const merchandiseDetails: { caption: string; qty: number }[] = [];
          const merchandiseData = cart?.cart?.filter(
            (item: ProductData) => item.product_data.metadata.type === "merchandise"
          ) as MerchandiseProduct[];

          const merchandiseItems = merchandiseData[0]!.product_data.metadata.merchandiseItems ?? [];
          const merchandiseItemIds = merchandiseItems.map((item) => item.id);
          const merchandiseWithTaxOverrideData = cart?.cart?.filter(
            (item: ProductData) => item.product_data.metadata.type === "merchandiseWithTaxOverride"
          ) as MerchandiseWithTaxOverride[];
          const merchandiseWithTaxOverrideItems =
            merchandiseWithTaxOverrideData[0]?.product_data.metadata.merchandiseItems ?? [];
          merchandiseItemIds.push(...merchandiseWithTaxOverrideItems.map((item) => item.id));

          purchasedMerchandise = await db
            .select({
              id: courseMerchandise.id,
              caption: courseMerchandise.caption,
              qoh: courseMerchandise.qoh,
            })
            .from(courseMerchandise)
            .where(inArray(courseMerchandise.id, merchandiseItemIds))
            .execute()
            .catch((error) => {
              void loggerService.errorLog({
                userId: userId,
                url: "/TokenizeService/tokenizeBooking",
                userAgent: "",
                message: "COURSE MERCHANDISE ERROR",
                stackTrace: `${error.stack}`,
                additionalDetailsJSON: `${JSON.stringify({
                  merchandiseItemIds,
                  merchandiseItems,
                  merchandiseData,
                  cart,
                })}`,
              });
              throw error;
            });
          for (const merchandise of purchasedMerchandise) {
            const merchandiseItem = merchandiseItems.find((item) => item.id === merchandise.id);
            merchandiseDetails.push({
              caption: merchandise.caption,
              qty: merchandiseItem?.qty ?? 0,
            });
          }

          const courseContactsList = await this.database
            .select({
              email: courseContacts.email,
              phone: courseContacts.phone1,
            })
            .from(courseContacts)
            .where(
              and(eq(courseContacts.courseId, teeTime.courseId), eq(courseContacts.sendNotification, true))
            )
            .execute()
            .catch((err) => {
              this.logger.error(`Error getting course contacts list, ${JSON.stringify(err.message)}`);
              loggerService.errorLog({
                userId: userId,
                url: "/reserveGroupBooking",
                userAgent: "",
                message: "ERROR_GETTING_COURSE_CONTACTS_LIST",
                stackTrace: `${JSON.stringify(err)}`,
                additionalDetailsJSON: JSON.stringify({
                  userId,
                  teeTimeId: teeTime.id,
                  error: err,
                }),
              });
              return [];
            });

          const [user] = await this.database.select().from(users).where(eq(users.id, userId)).execute();
          const emailList = courseContactsList.map((contact) => contact.email);
          if (emailList.length > 0) {
            emailList.map(async (email) => {
              await this.notificationService.sendEmailByTemplate(
                email,
                "Reservation Additional Request",
                process.env.SENDGRID_COURSE_CONTACT_NOTIFICATION_TEMPLATE_ID!,
                {
                  EMail: user?.email ?? "",
                  CustomerName: user?.name ?? "",
                  NoteFromUser: additionalNoteFromUser || "-",
                  NeedRentals: needRentals ? "Yes" : "No",
                  PlayDateTime: formatTime(teeTime.providerDate, true, teeTime.timezoneCorrection ?? 0),
                  HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
                  CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.cdnKey}.${teeTime.extension}`,
                  PurchasedMerchandise: purchasedMerchandise?.length > 0 ? true : false,
                  MerchandiseDetails: merchandiseDetails,
                },
                []
              );
            });
          }
        }

        const providerBooking = {
          providerBookingId: provider.getBookingId(booking),
          providerBookingSlotIds: provider.getSlotIdsFromBooking(booking),
          playerCount: courseMembershipId ? +playerCountForMemberShip : requiredSpots,
          teeTimeId: teeTime.id,
        };
        if (!providerBooking.providerBookingId) {
          this.logger.error(`No booking id found in response from provider: ${JSON.stringify(booking)}`);
          throw new Error("No booking id found in response from provider");
        }
        remainingPlayersToBook -= requiredSpots;
        providerBookings.push(providerBooking);
      } catch (e) {
        console.log("BOOKING FAILED ON PROVIDER, INITIATING REFUND FOR PAYMENT_ID", payment_id);
        this.hyperSwitchService.sendEmailForBookingFailed(
          paymentId,
          teeTime.courseId,
          cartId,
          sensibleQuoteId,
          userId,
          bookingStage,
          teeTimeIds,
          {
            userName: customerDetails?.userName ?? "",
            userEmail: customerDetails?.userEmail ?? "",
            courseName: firstTeeTime.courseName ?? "",
            teeTimeDate: firstTeeTime.providerDate,
          }
        );
        for (const providerBooking of providerBookings) {
          const providerBookingId = providerBooking.providerBookingId;
          try {
            await provider.deleteBooking(
              token,
              teeTime.providerCourseId!,
              teeTime.providerTeeSheetId!,
              providerBookingId
            );
          } catch (error: any) {
            this.logger.error(`Error removing booking, ${JSON.stringify(error.message)}`);
            loggerService.errorLog({
              userId: userId,
              url: "/reserveGroupBooking",
              userAgent: "",
              message: "ERROR_REMOVING_BOOKING",
              stackTrace: `${JSON.stringify(error)}`,
              additionalDetailsJSON: JSON.stringify({
                userId,
                teeTimeId: teeTime.id,
                error,
                booking: JSON.stringify(providerBooking),
              }),
            });
          }
        }
        throw "Booking failed on provider";
      }
    }

    console.log(`Creating tokenized booking`);

    //create tokenized bookings

    const bookingId = await this.tokenizeService
      .tokenizeBooking({
        redirectHref,
        userId,
        purchasePrice: pricePerGolfer,
        players: playerCount as number,
        providerBookingId,
        providerTeeTimeId: "" as string,
        paymentId: paymentId as string,
        withCart: true,
        provider: provider,
        token: token,
        teeTime: firstTeeTime,
        normalizedCartData: {
          cart,
          primaryGreenFeeCharge,
          taxCharge,
          sensibleCharge,
          convenienceCharge,
          charityCharge,
          taxes,
          total,
          charityId,
          weatherQuoteId,
          cartId,
          markupCharge,
          merchandiseCharge: merchandiseTotalCharge,
        },
        isWebhookAvailable: firstTeeTime?.isWebhookAvailable ?? false,
        providerBookingIds,
        cartFeeCharge: cartFeeCharge,
        additionalTaxes: {
          greenFeeTaxTotal,
          markupTaxTotal,
          weatherGuaranteeTaxTotal,
          cartFeeTaxPercentTotal,
          additionalTaxes,
          merchandiseTaxTotal: merchandiseTaxTotal + merchandiseOverriddenTaxAmount,
        },
        source,
        additionalNoteFromUser,
        needRentals,
        courseMembershipId: courseMembershipId,
        playerCountForMemberShip,
        isFirstHandGroupBooking: true,
        providerBookings,
        purchasedMerchandise,
      })
      .catch(async (err) => {
        this.logger.error(`Error creating booking, ${err}`);
        //@TODO this email should be removed
        await this.notificationService.createNotification(
          userId,
          "Error creating group booking",
          "An error occurred while creating booking with provider",
          firstTeeTime.courseId
        );
        this.hyperSwitchService.sendEmailForBookingFailed(
          paymentId,
          firstTeeTime.courseId,
          cartId,
          sensibleQuoteId,
          userId,
          bookingStage,
          teeTimeIds,
          {
            userName: customerDetails?.userName ?? "",
            userEmail: customerDetails?.userEmail ?? "",
            courseName: firstTeeTime.courseName ?? "",
            teeTimeDate: firstTeeTime.providerDate,
          }
        );
        for (const providerBooking of providerBookings) {
          const providerBookingId = providerBooking.providerBookingId;
          try {
            await provider.deleteBooking(
              token,
              firstTeeTime.providerCourseId!,
              firstTeeTime.providerTeeSheetId!,
              providerBookingId
            );
          } catch (error: any) {
            this.logger.error(`Error removing booking, ${JSON.stringify(error.message)}`);
            loggerService.errorLog({
              userId: userId,
              url: "/reserveGroupBooking",
              userAgent: "",
              message: "ERROR_REMOVING_BOOKING",
              stackTrace: `${JSON.stringify(error)}`,
              additionalDetailsJSON: JSON.stringify({
                userId,
                teeTimeIds: teeTimeIdsAsString,
                error,
                booking: JSON.stringify(providerBooking),
              }),
            });
          }
        }
        loggerService.errorLog({
          userId: userId,
          url: "/reserveGroupBooking",
          userAgent: "",
          message: "TEE TIME BOOKING FAILED ON GOLF DISTRIC",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: `first hand booking at provider failed for teetime ${teeTimeIdsAsString}`,
        });
        throw new Error(`Error creating booking`);
      });

    const bookingIds = bookingId.bookingId.split(",");
    // for (const bookingId of bookingIds) {
    await this.sendMessageToVerifyPayment(paymentId as string, userId, bookingId.bookingId, redirectHref);
    // }
    return {
      bookingId: bookingIds[0],
      providerBookingId,
      status: "Reserved",
      isEmailSend: bookingId.isEmailSend,
    } as ReserveTeeTimeResponse;
  };
  /**
   * Lists a Group booking for sale.
   * @todo add validation for max price
   * @param userId - The ID of the user listing the booking.
   * @param listPrice - The price at which the booking is listed.
   * @param groupId - ID of the group booking being listed.
   * @param courseId - ID of the course for the bookings.
   * @param endTime - End time for the booking listing.
   * @returns A promise that resolves when the operation completes.
   * @throws Error - Throws an error if end time is before start time, if the user does not own a tee time, or if other conditions like allowed players are not met.
   */
  createListingForGroupBookings = async (
    userId: string,
    listPrice: number,
    groupId: string,
    endTime: Date,
    slots: number
  ) => {
    console.warn("Group ID:", groupId);
    // console.log("CREATINGLISTING FOR DATE:", dayjs(endTime).utc().format('YYYY-MM-DD'), dayjs(endTime).utc().format('HHmm'));
    if (new Date().getTime() >= endTime.getTime()) {
      this.logger.warn("End time cannot be before current time");
      loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/createListingForGroupBookings",
        userAgent: "",
        message: "TEE_TIME_LISTED_FAILED",
        stackTrace: "",
        additionalDetailsJSON: "End time cannot be before current time.",
      });
      throw new Error("End time cannot be before current time");
    }

    if (!slots) {
      this.logger.warn(`Slots less than one`);
      throw new Error("Slots less than one");
    }
    if (!groupId) {
      this.logger.warn(`No group specified.`);
      throw new Error("No group specified.");
    }

    const ownedBookings = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        teeTimeId: bookings.teeTimeId,
        isListed: bookings.isListed,
        providerDate: teeTimes.providerDate,
        playerCount: bookings.playerCount,
        totalAmount: bookings.totalAmount,
        timezoneCorrection: courses.timezoneCorrection,
        providerBookingId: bookings.providerBookingId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(
        and(
          eq(bookings.ownerId, userId),
          eq(bookings.groupId, groupId),
          or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CONFIRMED"))
        )
      )
      .orderBy(asc(teeTimes.providerDate))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForGroupBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_BOOKINGS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            groupId,
            listPrice,
            endTime,
            slots,
          }),
        });
        throw new Error("Error retrieving bookings");
      });
    if (!ownedBookings.length) {
      this.logger.warn(`User ${userId} does not own  specified bookings.`);
      throw new Error("User does not  own specified bookings.");
    }
    for (const booking of ownedBookings) {
      if (booking.isListed) {
        this.logger.warn(`Booking ${booking.id} is already listed.`);
        loggerService.errorLog({
          applicationName: "golfdistrict-foreup",
          clientIP: "",
          userId,
          url: "/createListingForBookings",
          userAgent: "",
          message: "TEE_TIME_LISTED_FAILED",
          stackTrace: "",
          additionalDetailsJSON: "One or more bookings from this tee time is already listed",
        });
        throw new Error(`One or more bookings from this tee time is already listed.`);
      }
    }

    const firstBooking = ownedBookings[0];

    const [lastBooking] = ownedBookings.slice(-1);
    if (!lastBooking || !firstBooking) {
      this.logger.warn(`Bookings by Group id: ${groupId}, not found.`);
      throw new Error(`Bookings by Group id: ${groupId}, not found.`);
    }
    const courseId = lastBooking.courseId ?? "";

    const [course] = await this.database
      .select({
        key: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        name: courses.name,
        id: courses.id,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving course: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForGroupBookings",
          userAgent: "",
          message: "ERROR_RETRIEVING_COURSE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        throw new Error(`Error retrieving course`);
      });

    const toCreate: InsertList = {
      id: randomUUID(),
      userId: userId,
      listPrice: listPrice * 100,
      isDeleted: false,
      slots: Math.min(lastBooking.playerCount, slots),
    };
    await this.database
      .transaction(async (transaction) => {
        await transaction
          .update(bookings)
          .set({
            isListed: true,
            listId: toCreate.id,
          })
          .where(eq(bookings.id, lastBooking.id))
          .execute()
          .catch((err) => {
            this.logger.error(`Error updating bookingId: ${lastBooking.id}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/createListingForGroupBookings",
              userAgent: "",
              message: "ERROR_UPDATING_BOOKING_ID",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                bookingId: lastBooking.id,
              }),
            });
            transaction.rollback();
          });

        await transaction
          .update(groupBookings)
          .set({
            isListed: true,
            listPricePerGolfer: listPrice * 100,
            listSlots: slots,
          })
          .where(eq(groupBookings.id, groupId))
          .execute()
          .catch((err) => {
            this.logger.error(`Error updating groupBookingId: ${groupId}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/createListingForGroupBookings",
              userAgent: "",
              message: "ERROR_UPDATING_GROUP_BOOKING_ID",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                groupBookingId: groupId,
              }),
            });
            transaction.rollback();
          });

        //create listing
        await transaction
          .insert(lists)
          .values(toCreate)
          .execute()
          .catch((err) => {
            this.logger.error(`Error creating listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/createListingForGroupBookings",
              userAgent: "",
              message: "ERROR_CREATING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                lists: JSON.stringify(toCreate),
              }),
            });
            transaction.rollback();
          });
      })
      .catch((err) => {
        this.logger.error(`Transaction rolled backError creating listing: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForGroupBookings",
          userAgent: "",
          message: "TRANSACTION_ROLLBACK_ERROR_CREATING_LISTING",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            lists: JSON.stringify(toCreate),
          }),
        });
        throw new Error("Error creating listing");
      });

    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Failed to retrieve user: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/createListingForGroupBookings",
          userAgent: "",
          message: "FAILED_TO_RETRIEVE_USER",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userId,
          }),
        });
        throw new Error("Failed to retrieve user");
      });

    if (!user) {
      this.logger.error(`createNotification: User with ID ${userId} not found.`);
      loggerService.errorLog({
        userId: userId,
        url: "/createListingForGroupBookings",
        userAgent: "",
        message: "USER_NOT_FOUND",
        stackTrace: `User with ID ${userId} not found.`,
        additionalDetailsJSON: JSON.stringify({
          userId,
        }),
      });
      return;
    }
    console.log("######", ownedBookings);
    if (user.email && user.name) {
      await this.notificationService
        .sendEmailByTemplate(
          user.email,
          "Listing Created",
          process.env.SENDGRID_LISTING_CREATED_TEMPLATE_ID!,
          {
            CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
            CourseURL: course?.websiteURL || "",
            CourseName: course?.name,
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            CustomerFirstName: user?.name?.split(" ")[0],
            // CourseReservationID: lastBooking?.providerBookingId ?? "-",
            PlayDateTime: formatTime(
              firstBooking.providerDate ?? "",
              true,
              firstBooking.timezoneCorrection ?? 0
            ),
            PlayerCount: slots ?? 0,
            ListedPricePerPlayer: listPrice ? `${listPrice}` : "-",
            TotalAmount: formatMoney(lastBooking.totalAmount / 100 ?? 0),
          },
          []
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/createListingForGroupBookings",
            userAgent: "",
            message: "ERROR_SENDING_EMAIL",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              userId,
              email: user.email,
              name: user.name,
              courseName: course?.name,
            }),
          });
          throw new Error("Error sending email");
        });
    }

    if (!lastBooking.providerDate) {
      this.logger.error("providerDate not found in booking, Can't send notifications to users");
      loggerService.errorLog({
        userId: userId,
        url: "/createListingForGroupBookings",
        userAgent: "",
        message: "PROVIDER_DATE_NOT_FOUND",
        stackTrace: `providerDate not found in booking, Can't send notifications to users`,
        additionalDetailsJSON: JSON.stringify({
          userId,
        }),
      });
      throw new Error("providerDate not found in booking, Can't send notifications to users");
    }

    const [date, time] = lastBooking.providerDate.split("T");

    const splittedTime = time!.split("-")[0]!.split(":");
    const formattedTime = Number(splittedTime[0]! + splittedTime[1]!);

    // send notifications to users
    await this.userWaitlistService.sendNotificationsForAvailableTeeTime(
      date,
      formattedTime,
      courseId,
      userId,
      toCreate.id
    );
    return { success: true, body: { listingId: toCreate.id }, message: "Listings created successfully." };
  };

  /**
   * Cancel a pending listing and update associated bookings.
   * @param {string} userId - The ID of the user canceling the listing.
   * @param {string} groupId - The group ID of the listing to be canceled.
   * @returns {Promise<void>} - Resolves when the listing is successfully canceled.
   * @throws {Error} - Throws an error if the listing is not found, is not pending, or is already deleted.
   * @example
   * // Example usage:
   * const userId = "user123";
   * const groupId = "grouping456";
   * await bookingService.cancelGroupListing(userId, listingId);
   */
  cancelGroupListing = async (userId: string, groupId: string) => {
    if (!groupId) {
      this.logger.error("Invalid group ID");
      throw new Error("Invalid group ID");
    }

    const groupedBookings = await this.database
      .select({
        id: bookings.id,
        courseId: teeTimes.courseId,
        listingId: bookings.listId,
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(
        and(
          eq(bookings.groupId, groupId),
          or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CONFIRMED")),
          eq(bookings.isListed, true)
        )
      )
      .execute();

    if (groupedBookings && !groupedBookings.length) {
      throw new Error("No booking found for this listing");
    }
    const courseId = groupedBookings[0]?.courseId ?? "";

    await this.database.transaction(async (trx) => {
      for (const booking of groupedBookings) {
        const listId = booking.listingId ?? "";
        if (!listId) {
          this.logger.error(`Invalid listing for group ID: ${groupId}`);
          loggerService.errorLog({
            userId: userId,
            url: "/cancelGroupListing",
            userAgent: "",
            message: "INVALID_LISTING_FOR_GROUP_ID",
            stackTrace: `Invalid listing for group ID: ${groupId}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
              listingId: booking.listingId,
              groupId,
            }),
          });
        }

        await trx
          .update(lists)
          .set({
            isDeleted: true,
            cancelledByUserId: userId,
          })
          .where(eq(lists.id, listId))
          .execute()
          .catch((err) => {
            this.logger.error(`Error deleting listing: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/cancelGroupListing",
              userAgent: "",
              message: "ERROR_DELETING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                listId,
              }),
            });
            trx.rollback();
          });

        await trx
          .update(bookings)
          .set({
            isListed: false,
            listId: null,
          })
          .where(eq(bookings.id, booking.id))
          .execute()
          .catch((err) => {
            this.logger.error(`Error updating bookingId: ${booking.id}: ${err}`);
            loggerService.errorLog({
              userId: userId,
              url: "/cancelGroupListing",
              userAgent: "",
              message: "ERROR_DELETING_BOOKING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                groupId,
              }),
            });
            trx.rollback();
          });
      }

      await trx
        .update(groupBookings)
        .set({
          isListed: false,
          listPricePerGolfer: 0,
          listSlots: 0,
        })
        .where(eq(groupBookings.id, groupId))
        .execute()
        .catch((err) => {
          this.logger.error(`Error updating groupBookingId: ${groupId}: ${err}`);
          loggerService.errorLog({
            userId: userId,
            url: "/cancelGroupListing",
            userAgent: "",
            message: "ERROR_DELETING_GROUP_BOOKING_LISTING",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
        });
    });
    const [user] = await this.database
      .select({
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const [course] = await this.database
      .select({
        websiteURL: courses.websiteURL,
        key: assets.key,
        extension: assets.extension,
        name: courses.name,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(`error fetching course data: ${err}`);
        loggerService.errorLog({
          userId: userId,
          url: "/cancelGroupListing",
          userAgent: "",
          message: "ERROR_FETCHING_COURSE_DATA",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
            groupId,
          }),
        });
        throw new Error("Error fetching course data");
      });

    if (!user) {
      this.logger.error(`Error fetching user data: ${userId} does not exist`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelGroupListing",
        userAgent: "",
        message: "ERROR_FETCHING_USER_DATA",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          courseId,
          groupId,
        }),
      });
      throw new Error(`Error fetching user data: ${userId} does not exist`);
    }

    if (!course) {
      this.logger.error(`Error fetching course data: ${courseId} does not exist`);
      loggerService.errorLog({
        userId: userId,
        url: "/cancelGroupListing",
        userAgent: "",
        message: "ERROR_FETCHING_COURSE_DATA",
        stackTrace: "",
        additionalDetailsJSON: JSON.stringify({
          courseId,
          groupId,
        }),
      });
      throw new Error(`Error fetching course data: ${courseId} does not exist`);
    }

    if (user.email && user.name && course) {
      await this.notificationService.sendEmailByTemplate(
        user.email,
        "Listing Cancelled",
        process.env.SENDGRID_LISTING_CANCELLED_TEMPLATE_ID!,
        {
          CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${course?.key}.${course?.extension}`,
          CourseURL: course?.websiteURL || "",
          CourseName: course?.name,
          HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
          CustomerFirstName: user?.name?.split(" ")[0],
        },
        []
      );
    }
  };

  addListingForRemainingSlotsOnGroupBooking = async (
    groupId: string,
    listedSlotsCount = 0,
    ownerId: string
  ) => {
    try {
      if (listedSlotsCount === 0) {
        this.logger.error("Invalid listing slots count");
        throw new Error("Invalid listing slots count");
      }
      const [groupBooking] = await this.database
        .select({
          courseId: groupBookings.courseId,
          listPricePerGolfer: groupBookings.listPricePerGolfer,
          listSlots: groupBookings.listSlots,
          isListed: groupBookings.isListed,
        })
        .from(groupBookings)
        .where(eq(groupBookings.id, groupId))
        .execute();

      if (!groupBooking) {
        this.logger.error(`Group booking not found for group ID: ${groupId}`);
        throw new Error(`Group booking not found for group ID: ${groupId}`);
      }

      if (groupBooking.isListed && groupBooking.listSlots > listedSlotsCount) {
        const ownedBookings = await this.database
          .select({
            id: bookings.id,
            courseId: teeTimes.courseId,
            teeTimeId: bookings.teeTimeId,
            isListed: bookings.isListed,
            providerDate: teeTimes.providerDate,
            playerCount: bookings.playerCount,
            totalAmount: bookings.totalAmount,
            timezoneCorrection: courses.timezoneCorrection,
            providerBookingId: bookings.providerBookingId,
            userId: bookings.ownerId,
          })
          .from(bookings)
          .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
          .leftJoin(courses, eq(courses.id, teeTimes.courseId))
          .where(
            and(
              eq(bookings.groupId, groupId),
              or(eq(bookings.status, "RESERVED"), eq(bookings.status, "CONFIRMED"))
            )
          )
          .orderBy(asc(teeTimes.providerDate))
          .execute()
          .catch((err) => {
            this.logger.error(`Error retrieving bookings: ${err}`);
            loggerService.errorLog({
              userId: "",
              url: "/addListingForRemainingSlotsOnGroupBooking",
              userAgent: "",
              message: "ERROR_RETRIEVING_BOOKINGS",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                groupId,
                groupBooking,
              }),
            });
            throw new Error("Error retrieving bookings");
          });
        if (!ownedBookings.length) {
          throw new Error("Can not  specified bookings.");
        }
        for (const booking of ownedBookings) {
          if (booking.isListed) {
            this.logger.warn(`Booking ${booking.id} is already listed.`);
            loggerService.errorLog({
              applicationName: "golfdistrict-foreup",
              clientIP: "",
              userId: "",
              url: "/addListingForRemainingSlotsOnGroupBooking",
              userAgent: "",
              message: "TEE_TIME_LISTED_FAILED",
              stackTrace: "",
              additionalDetailsJSON: "One or more bookings from this tee time is already listed",
            });
            throw new Error(`One or more bookings from this tee time is already listed.`);
          }
        }

        const [lastBooking] = ownedBookings.slice(-1);
        if (!lastBooking) {
          this.logger.warn(`Bookings by Group id: ${groupId}, not found.`);
          throw new Error(`Bookings by Group id: ${groupId}, not found.`);
        }

        const remainingSlots = groupBooking.listSlots - listedSlotsCount;
        const toCreate: InsertList = {
          id: randomUUID(),
          userId: lastBooking.userId,
          listPrice: groupBooking.listPricePerGolfer,
          isDeleted: false,
          slots: Math.min(lastBooking.playerCount, remainingSlots),
        };
        await this.database
          .transaction(async (transaction) => {
            await transaction
              .update(bookings)
              .set({
                isListed: true,
                listId: toCreate.id,
              })
              .where(eq(bookings.id, lastBooking.id))
              .execute()
              .catch((err) => {
                this.logger.error(`Error updating bookingId: ${lastBooking.id}: ${err}`);
                loggerService.errorLog({
                  userId: "",
                  url: "/addListingForRemainingSlotsOnGroupBooking",
                  userAgent: "",
                  message: "ERROR_UPDATING_BOOKING_ID",
                  stackTrace: `${err.stack}`,
                  additionalDetailsJSON: JSON.stringify({
                    groupId,
                    groupBooking,
                    bookingId: lastBooking.id,
                  }),
                });
                transaction.rollback();
              });

            await transaction
              .update(groupBookings)
              .set({
                listSlots: remainingSlots,
              })
              .where(eq(groupBookings.id, groupId))
              .execute()
              .catch((err) => {
                this.logger.error(`Error updating groupBookingId: ${groupId}: ${err}`);
                loggerService.errorLog({
                  userId: "",
                  url: "/addListingForRemainingSlotsOnGroupBooking",
                  userAgent: "",
                  message: "ERROR_UPDATING_GROUP_BOOKING_ID",
                  stackTrace: `${err.stack}`,
                  additionalDetailsJSON: JSON.stringify({
                    groupBooking,
                    groupBookingId: groupId,
                  }),
                });
                transaction.rollback();
              });

            //create listing
            await transaction
              .insert(lists)
              .values(toCreate)
              .execute()
              .catch((err) => {
                this.logger.error(`Error creating listing: ${err}`);
                loggerService.errorLog({
                  userId: "",
                  url: "/addListingForRemainingSlotsOnGroupBooking",
                  userAgent: "",
                  message: "ERROR_CREATING_LISTING",
                  stackTrace: `${err.stack}`,
                  additionalDetailsJSON: JSON.stringify({
                    groupBooking,
                    lists: JSON.stringify(toCreate),
                  }),
                });
                transaction.rollback();
              });
          })
          .catch((err) => {
            this.logger.error(`Transaction rolled backError creating listing: ${err}`);
            loggerService.errorLog({
              userId: "",
              url: "/addListingForRemainingSlotsOnGroupBooking",
              userAgent: "",
              message: "TRANSACTION_ROLLBACK_ERROR_CREATING_LISTING",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                groupBooking,
                lists: JSON.stringify(toCreate),
                ownerId,
              }),
            });
            throw new Error("Error creating listing");
          });
        this.logger.info(
          `Listing created successfully. for groupId ${groupId} teeTimeId ${lastBooking.teeTimeId}`
        );

        const [date, time] = lastBooking.providerDate!.split("T");

        const splittedTime = time!.split("-")[0]!.split(":");
        const formattedTime = Number(splittedTime[0]! + splittedTime[1]!);

        // send notifications to users
        await this.userWaitlistService.sendNotificationsForAvailableTeeTime(
          date,
          formattedTime,
          groupBooking.courseId,
          ownerId,
          toCreate.id
        );
      } else {
        // update the group to be unlisted
        await this.database
          .update(groupBookings)
          .set({
            isListed: false,
            listSlots: 0,
            listPricePerGolfer: 0,
          })
          .where(eq(groupBookings.id, groupId))
          .execute();
      }
    } catch (error: any) {
      this.logger.error(`Error adding listing for remaining slots, ${JSON.stringify(error)}`);
      loggerService.errorLog({
        userId: "",
        url: "/addListingForRemainingSlotsOnGroupBooking",
        userAgent: "",
        message: "ERROR_ADDING_LISTING_FOR_REMAINING_SLOTS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          groupId,
          listedSlotsCount,
        }),
      });
    }
  };
  addListingForRemainingSlots = async (
    bookingId: string,
    providerBookingId: string,
    previousListid: string,
    slotsToList = 0,
    ownerId: string
  ) => {
    try {
      if (slotsToList === 0) {
        this.logger.error("Invalid listing slots count");
        throw new Error("Invalid listing slots count");
      }

      const [previousListing] = await this.database
        .select({
          listPrice: lists.listPrice,
        })
        .from(lists)
        .where(eq(lists.id, previousListid))
        .execute();

      if (!previousListing) {
        this.logger.error(`Listing not found for list ID: ${previousListid}`);
        throw new Error(`Listing not found for list ID: ${previousListid}`);
      }

      const [previousBooking] = await this.database
        .select({
          providerDate: teeTimes.providerDate,
          userName: users.name,
          courseId: teeTimes.courseId,
          userEmail: users.email,
          courseName: courses.name,
          key: assets.key,
          extension: assets.extension,
          courseWebsiteURL: courses.websiteURL,
          timezoneCorrection: courses.timezoneCorrection,
        })
        .from(bookings)
        .innerJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
        .innerJoin(users, eq(bookings.ownerId, users.id))
        .innerJoin(courses, eq(teeTimes.courseId, courses.id))
        .leftJoin(assets, eq(assets.id, courses.logoId))
        .where(eq(bookings.id, bookingId))
        .execute();

      if (!previousBooking) {
        this.logger.error(`Booking not found for booking ID: ${bookingId}`);
        throw new Error(`Booking not found for booking ID: ${bookingId}`);
      }

      const toCreate: InsertList = {
        id: randomUUID(),
        userId: ownerId,
        listPrice: previousListing.listPrice,
        isDeleted: false,
        slots: slotsToList,
        allowSplit: true,
      };
      await this.database
        .transaction(async (transaction) => {
          await transaction
            .update(bookings)
            .set({
              isListed: true,
              listId: toCreate.id,
            })
            .where(eq(bookings.id, bookingId))
            .execute()
            .catch((err) => {
              this.logger.error(`Error updating bookingId: ${bookingId}: ${err}`);
              loggerService.errorLog({
                userId: "",
                url: "/addListingForRemainingSlots",
                userAgent: "",
                message: "ERROR_UPDATING_BOOKING_ID",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingId,
                }),
              });
              transaction.rollback();
            });

          //create listing
          await transaction
            .insert(lists)
            .values(toCreate)
            .execute()
            .catch((err) => {
              this.logger.error(`Error creating listing: ${err}`);
              loggerService.errorLog({
                userId: "",
                url: "/addListingForRemainingSlots",
                userAgent: "",
                message: "ERROR_CREATING_LISTING",
                stackTrace: `${err.stack}`,
                additionalDetailsJSON: JSON.stringify({
                  bookingId,
                  lists: JSON.stringify(toCreate),
                }),
              });
              transaction.rollback();
            });
        })
        .catch((err) => {
          this.logger.error(`Transaction rolled backError creating listing: ${err}`);
          loggerService.errorLog({
            userId: "",
            url: "/addListingForRemainingSlots",
            userAgent: "",
            message: "TRANSACTION_ROLLBACK_ERROR_CREATING_LISTING",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              bookingId,
              lists: JSON.stringify(toCreate),
              ownerId,
            }),
          });
          throw new Error("Error creating listing");
        });

      const [date, time] = previousBooking.providerDate.split("T");

      const splittedTime = time!.split("-")[0]!.split(":");
      const formattedTime = Number(splittedTime[0]! + splittedTime[1]!);

      if (previousBooking.userEmail && previousBooking.userName) {
        await this.notificationService
          .sendEmailByTemplate(
            previousBooking.userEmail,
            "Listing Created",
            process.env.SENDGRID_LISTING_CREATED_TEMPLATE_ID!,
            {
              CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${previousBooking.key}.${previousBooking.extension}`,
              CourseURL: previousBooking.courseWebsiteURL || "",
              CourseName: previousBooking.courseName,
              HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
              CustomerFirstName: previousBooking.userName?.split(" ")[0],
              CourseReservationID: providerBookingId ?? "-",
              PlayDateTime: formatTime(
                previousBooking.providerDate ?? "",
                true,
                previousBooking.timezoneCorrection ?? 0
              ),
              PlayerCount: slotsToList ?? 0,
              ListedPricePerPlayer: previousListing.listPrice ? `${previousListing.listPrice}` : "-",
            },
            []
          )
          .catch((err) => {
            this.logger.error(`Error sending email: ${err}`);
            loggerService.errorLog({
              userId: ownerId,
              url: "/addListingForRemainingSlots",
              userAgent: "",
              message: "ERROR_SENDING_EMAIL",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                ownerId,
                email: previousBooking.userEmail,
                name: previousBooking.userName,
                courseName: previousBooking.courseName,
                previousBooking,
              }),
            });
            throw new Error("Error sending email");
          });
      }

      // send notifications to users
      await this.userWaitlistService.sendNotificationsForAvailableTeeTime(
        date,
        formattedTime,
        previousBooking.courseId,
        ownerId,
        toCreate.id
      );
    } catch (error: any) {
      this.logger.error(`Error adding listing for remaining slots, ${JSON.stringify(error)}`);
      loggerService.errorLog({
        userId: "",
        url: "/addListingForRemainingSlots",
        userAgent: "",
        message: "ERROR_ADDING_LISTING_FOR_REMAINING_SLOTS",
        stackTrace: `${error.stack}`,
        additionalDetailsJSON: JSON.stringify({
          bookingId,
          ownerId,
          previousListid,
          slotsToList,
        }),
      });
    }
  };
}

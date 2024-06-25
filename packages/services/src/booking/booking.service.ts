import { randomUUID } from "crypto";
import { and, asc, desc, eq, gte, inArray, or, sql, type Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import type { InsertBooking } from "@golf-district/database/schema/bookings";
import { bookings } from "@golf-district/database/schema/bookings";
import { bookingslots } from "@golf-district/database/schema/bookingslots";
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
import { currentUtcTimestamp, dateToUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { alias } from "drizzle-orm/mysql-core";
import { appSettingService } from "../app-settings/initialized";
import type { CustomerCart, ProductData } from "../checkout/types";
import type { NotificationService } from "../notification/notification.service";
import type { HyperSwitchService } from "../payment-processor/hyperswitch.service";
import type { SensibleService } from "../sensible/sensible.service";
import type { Customer, ProviderService } from "../tee-sheet-provider/providers.service";
import type { ProviderAPI } from "../tee-sheet-provider/sheet-providers";
import type { BookingResponse } from "../tee-sheet-provider/sheet-providers/types/foreup.type";
import type { TokenizeService } from "../token/tokenize.service";
import type { UserWaitlistService } from "../user-waitlist/userWaitlist.service";
import type { LoggerService } from "../webhooks/logging.service";

dayjs.extend(UTC);

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
  slotsData: SlotsData[];
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
}
type RequestOptions = {
  method: string;
  headers: Headers;
  body: string;
  redirect: RequestRedirect;
};
/**
 * Service for managing bookings and transaction history.
 */
export class BookingService {
  private logger = Logger(BookingService.name);
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
    private readonly loggerService: LoggerService,
    private readonly hyperSwitchService: HyperSwitchService,
    private readonly sensibleService: SensibleService,
    private readonly userWaitlistService: UserWaitlistService
  ) { }

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
        this.logger.error(`Error retrieving bookings: ${err}`);
        throw new Error("Error retrieving bookings");
      });
    if (!bookingOwners.length) {
      this.logger.warn(`No bookings found.`);
      throw new Error("No bookings found.");
    }
    //check that all bookings are owned by the same user
    const ownerIds = new Set(bookingOwners.map((booking) => booking.ownerId));
    if (ownerIds.size > 1) {
      this.logger.warn(`Bookings are not owned by the same user.`);
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
    this.logger.info(`getTransactionHistory called with userId: ${userId}`);
    const data = await this.database
      .select({
        transferId: transfers.id,
        teeTimeId: bookings.teeTimeId,
        date: teeTimes.providerDate,
        courseId: teeTimes.courseId,
        courseName: courses.name,
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
      })
      .from(transfers)
      .innerJoin(bookings, eq(bookings.id, transfers.bookingId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(lists, eq(bookings.listId, lists.id))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      // .leftJoin(userBookingOffers, eq(userBookingOffers.bookingId, bookings.id))
      .where(or(eq(transfers.toUserId, userId), eq(transfers.fromUserId, userId)))
      .orderBy(desc(transfers.createdAt))
      .execute();
    console.log("========>", data.length);
    if (!data.length) {
      this.logger.info(`No tee times found for user: ${userId}`);
      return [];
    }
    const combinedData: Record<string, TransferData> = {};
    data.forEach((teeTime) => {
      if (!combinedData[teeTime.transferId]) {
        combinedData[teeTime.transferId] = {
          courseId,
          courseName: teeTime.courseName,
          courseLogo: teeTime.teeTimeImage
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.teeTimeImage.key}.${teeTime.teeTimeImage.extension}`
            : "/defaults/default-course.webp",
          date: teeTime.date ? teeTime.date : "",
          firstHandPrice: teeTime.greenFee ? teeTime.greenFee : 0,
          golfers: [{ id: "", email: "", handle: "", name: "", slotId: "" }],
          pricePerGolfer: teeTime.from === userId ? [teeTime.amount / 100] : [teeTime.purchasedPrice / 100],
          bookingIds: [teeTime.bookingId],
          status: teeTime.from === userId ? "SOLD" : "PURCHASED",
          playerCount: teeTime.players,
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
    this.logger.info(`getMyListedTeeTimes called with userId: ${userId}`);
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
        throw new Error("Error retrieving tee times");
      });
    const combinedData: Record<string, ListingData> = {};
    data.forEach((teeTime) => {
      if (teeTime.teeTimesId) {
        if (!combinedData[teeTime.teeTimesId]) {
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
    });
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
    this.logger.info(`getTeeTimeHistory called with teeTimeId: ${teeTimeId}`);
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
        this.loggerService.errorLog({
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
    this.logger.info(`getOwnedBookingsForTeeTime called with userId: ${userId}`);
    const data = await this.database
      .select({
        id: bookings.id,
      })
      .from(bookings)
      .where(and(eq(bookings.ownerId, userId), eq(bookings.teeTimeId, teeTimeId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        this.loggerService.errorLog({
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
    this.logger.info(`getOwnedTeeTimes called with userId: ${userId}`);
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
        purchasedFor: bookings.greenFeePerPlayer,
        providerBookingId: bookings.providerBookingId,
        slots: lists.slots,
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
          eq(bookings.ownerId, userId),
          eq(bookings.isActive, true),
          eq(teeTimes.courseId, courseId),
          gte(teeTimes.date, currentUtcTimestamp())
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
      this.loggerService.errorLog({
        applicationName: "golfdistrict-foreup",
        clientIP: "",
        userId,
        url: "/getOwnedTeeTimes",
        userAgent: "",
        message: "Error_FINDING_TEE_TIME ",
        stackTrace: "",
        additionalDetailsJSON: `No tee times found for user: ${userId}`,
      });
      return [];
    }
    const combinedData: Record<string, OwnedTeeTimeData> = {};

    data.forEach((teeTime) => {
      if (!combinedData[teeTime.providerBookingId]) {
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
        };
      } else {
        const currentEntry = combinedData[teeTime.providerBookingId];
        if (currentEntry) {
          currentEntry.bookingIds.push(teeTime.bookingId);
          currentEntry.slotsData.push({
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

      for (const slot of t.slotsData) {
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

    return combinedData;
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
    slots: number
  ) => {
    this.logger.info(`createListingForBookings called with userId: ${userId}`);
    // console.log("CREATINGLISTING FOR DATE:", dayjs(endTime).utc().format('YYYY-MM-DD'), dayjs(endTime).utc().format('HHmm'));
    if (new Date().getTime() >= endTime.getTime()) {
      this.logger.warn("End time cannot be before current time");
      this.loggerService.errorLog({
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
      })
      .from(bookings)
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(and(eq(bookings.ownerId, userId), inArray(bookings.id, bookingIds)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings: ${err}`);
        throw new Error("Error retrieving bookings");
      });
    if (!ownedBookings.length) {
      this.logger.debug(`Owned bookings: ${JSON.stringify(ownedBookings)}`);
      this.logger.warn(`User ${userId} does not own  specified bookings.`);
      throw new Error("User does not  own specified bookings.");
    }
    if (ownedBookings.length > 4) {
      this.logger.warn(`Cannot list more than 4 bookings.`);
      this.loggerService.errorLog({
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
    for (const booking of ownedBookings) {
      if (booking.isListed) {
        this.logger.warn(`Booking ${booking.id} is already listed.`);
        this.loggerService.errorLog({
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
        websiteURL: courses.websiteURL
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        return [];
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
            transaction.rollback();
          });
      })
      .catch((err) => {
        this.logger.error(`Transaction rolled backError creating listing: ${err}`);
        throw new Error("Error creating listing");
      });
    this.logger.info(`Listings created successfully. for user ${userId} teeTimeId ${firstBooking.teeTimeId}`);
    // await this.notificationService.createNotification(
    //   userId,
    //   "LISTING_CREATED",
    //   `Listing creation successful`,
    //   courseId
    // );
    const [user] = await this.database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .execute()
      .catch((err) => {
        this.logger.error(`Failed to retrieve user: ${err}`);
        throw new Error("Failed to retrieve user");
      });

    if (!user) {
      this.logger.error(`createNotification: User with ID ${userId} not found.`);
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
            HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
            CustomerFirstName: user.name,
          },
          []
        )
        .catch((err) => {
          this.logger.error(`Error sending email: ${err}`);
          throw new Error("Error sending email");
        });
    }

    if (!firstBooking.providerDate) {
      this.logger.error("providerDate not found in booking, Can't send notifications to users");
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
      userId
    );
    // console.log("CREATING LISTING FOR DATE:", date, formattedTime);
    return { success: true, body: { listingId: toCreate.id }, message: "Listings created successfully." };
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
    this.logger.info(`cancelListing called with userId: ${userId}`);
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
        this.loggerService.errorLog({
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
    // if (listing.status !== "PENDING") {
    //   this.logger.warn(`Listing is not pending.`);
    //   throw new Error("Listing is not pending");
    // }
    if (listing.isDeleted) {
      this.logger.warn(`Listing is already deleted.`);
      throw new Error("Listing is already deleted");
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
    console.log("cancel listing by user", userId);
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
            trx.rollback();
          });
      }
    });
    this.logger.info(`Listings cancelled successfully. for user ${userId} listingId ${listingId}`);
    await this.notificationService.createNotification(
      userId,
      "LISTING_CANCELLED",
      `Listing cancellation successful`,
      courseId
    );
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
    this.logger.info(`updateListing called with userId: ${userId}`);
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
        throw new Error("Error retrieving listing");
      });
    if (!listing) {
      this.logger.warn(`Listing not found. Either listing does not exist or user does not own listing.`);
      throw new Error("Owned listing not found");
    }
    // if (listing.status !== "PENDING") {
    //   this.logger.warn(`Listing is not pending.`);
    //   throw new Error("Listing is not pending");
    // }
    if (listing.isDeleted) {
      this.logger.warn(`Listing is already deleted.`);
      throw new Error("Listing is already deleted");
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
        throw new Error("Error retrieving bookings");
      });

    if (ownedBookings.length !== bookingIds.length || !ownedBookings[0]) {
      this.logger.debug(`Owned bookings: ${JSON.stringify(ownedBookings)}`);
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
            trx.rollback();
          });
        //create a new listing
        await trx
          .insert(lists)
          .values(toCreate)
          .execute()
          .catch((err) => {
            this.logger.error(`Error creating listing: ${err}`);
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
              trx.rollback();
            });
        }
      })
      .catch((err) => {
        this.logger.error(`Error updating listing: ${err}`);
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
    this.logger.info(`createOfferOnBookings called with userId: ${userId}`);
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
        throw new Error("Error retrieving bookings");
      });
    if (!data.length || data.length !== bookingIds.length || !data[0]) {
      this.logger.warn(`No bookings found.`);
      throw new Error("No bookings found");
    }
    const firstTeeTime = data[0].teeTimeId;
    const courseId = data[0].courseId ?? "";
    if (!data.every((booking) => booking.teeTimeId === firstTeeTime)) {
      throw new Error("All bookings must be under the same tee time.");
    }

    const minimumOfferPrice = Math.max(...data.map((booking) => booking.minimumOfferPrice));
    if (price === 0) {
      throw new Error("Offer price must be higher than 0");
    }
    if (price < minimumOfferPrice) {
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
    this.logger.info(`cancelOfferOnBooking called with userId: ${userId}`);
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
        throw new Error("Error retrieving offer");
      });
    if (!offerData?.[0]) {
      this.logger.warn(`Offer not found.`);
      throw new Error("Offer not found");
    }
    const bookingIds = offerData.map((offers) => offers.linkedBookingOffer);
    const { buyerId, status, isDeleted } = offerData[0];
    if (buyerId !== userId) {
      this.logger.warn(`User does not own offer.`);
      throw new Error("User does not own offer");
    }
    if (status !== "PENDING") {
      this.logger.warn(`Offer is not pending.`);
      throw new Error("Offer is not pending");
    }
    if (isDeleted) {
      this.logger.warn(`Offer is already deleted.`);
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
    this.logger.info(`acceptOffer called with userId: ${userId}`);
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
        throw new Error("Error retrieving offer");
      });

    if (!offer?.[0]) {
      this.logger.warn(`Offer not found.`);
      throw new Error("Offer not found");
    }
    const bookingIds = offer.map((offers) => offers.bookingIds);
    const { price, buyerId } = offer[0];
    //if the user does not own each booking then return error
    const bookingsOwner = offer.map((offers) => offers.bookingOwnerId);
    const listingIds = offer.map((offers) => offers.listingId);
    if (!bookingsOwner.every((id) => id === userId)) {
      this.logger.warn(`User does not own all bookings.`);
      throw new Error("User does not own all bookings");
    }
    //check that booking ids are not null or empty
    if (!bookingIds.length || !bookingIds[0]?.length) {
      this.logger.warn(`Booking not found.`);
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
            trx.rollback();
          });
        await trx
          .update(bookings)
          .set({ isListed: false, listId: null })
          .where(and(inArray(bookings.id, bookingIds as string[])))
          .execute()
          .catch((err) => {
            this.logger.error(`Error deleting listing: ${err}`);
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
    this.logger.info(`rejectOffer called with userId: ${userId}`);
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
        throw new Error("Error retrieving offer");
      });
    if (!offer) {
      this.logger.warn(`Offer not found.`);
      throw new Error("Offer not found");
    }
    const bookingIds = offer.map((offers) => offers.bookingIds);
    const bookingsOwned = offer.map((offers) => offers.bookingOwnerId);
    if (!bookingsOwned.every((ownerId) => ownerId === userId)) {
      this.logger.warn(`User does not own all bookings.`);
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
    this.logger.info(`getOffersForBooking called with bookingId: ${bookingId}`);
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
    this.logger.info(`getOfferSentForUser called with userId: ${userId}`);
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
    this.logger.info(`getOfferReceivedForUser called with userId: ${userId}`);
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
    this.logger.info(`updateNamesOnBookings called with userId: ${userId}`);
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
        throw new Error("Error retrieving bookings");
      });

    if (!data.length || !data[0]) {
      this.logger.warn(`No bookings found. or user does not own all bookings`);
      throw new Error("No bookings found");
    }
    const firstBooking = data[0];
    if (!firstBooking) {
      throw new Error("bookings not found");
    }
    const { token, provider } = await this.providerService.getProviderAndKey(
      firstBooking.internalId!,
      firstBooking.courseId!,
      firstBooking.providerCourseConfiguration!
    );
    if (!firstBooking.providerId || !firstBooking.providerCourseId || !firstBooking.courseId) {
      throw new Error("provider id, course id, or provider course id not found");
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
            console.log("Error setting names on booking: ", err);
          });
      })
    );

    //check if user created in fore-up or not
    // call find or create for user and update according to slot
    const customers: Customer[] = [];
    const providerDataToUpdate: {
      playerNumber: number | null;
      customerId: number | null;
      name: string | null;
      slotId: string | null;
    }[] = [];
    for (const user of usersToUpdate) {
      try {
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
          providerDataToUpdate.push({ name: user.name, playerNumber: 0, customerId: 0, slotId: user.slotId });
        }
      } catch (error) {
        console.log("Error creating customer", error);
        throw new Error("Error creating customer");
      }
    }

    for (const user of providerDataToUpdate) {
      await provider?.updateTeeTime(
        token || "",
        firstBooking?.providerCourseId || "",
        firstBooking?.providerTeeSheetId || "",
        firstBooking.providerBookingId,
        {
          data: {
            type: "Guest",
            id: firstBooking.providerBookingId,
            attributes: {
              type: "Guest",
              name: user.name,
              paid: false,
              cartPaid: false,
              noShow: false,
              personId: user.customerId != 0 ? user.customerId : "",
            },
          },
        },
        user.slotId || ""
      );
    }
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
    const primaryData = {
      primaryGreenFeeCharge: slotInfo[0].price,
      teeTimeId: slotInfo[0].product_data.metadata.tee_time_id,
      playerCount: slotInfo[0].product_data.metadata.number_of_bookings,
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

    const markupCharge =
      customerCartData?.cart?.cart
        ?.filter(({ product_data }: ProductData) => product_data.metadata.type === "markup")
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
    redirectHref: string
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
      markupCharge,
      taxes,
      total,
      charityId,
      weatherQuoteId,
      paymentId,
    } = await this.normalizeCartData({
      cartId,
      userId,
    });
    console.log(`Check if payment id is valid ${payment_id}`);
    const isValid = await this.checkIfPaymentIdIsValid(payment_id);
    if (!isValid) {
      throw new Error("Payment Id not is not valid");
    }
    if (!weatherQuoteId) {
      console.log("Cancel Sensible Quote ID : ", sensibleQuoteId);
      this.sensibleService.cancelQuote(sensibleQuoteId);
    }
    const pricePerGolfer = primaryGreenFeeCharge / playerCount;

    console.log(`Retrieving tee time from database ${teeTimeId}`);
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
        providerDate: teeTimes.providerDate,
        holes: teeTimes.numberOfHoles,
        cdnKey: assets.key,
        extension: assets.extension,
        websiteURL: courses.websiteURL,
        courseName: courses.name,
        entityName: entities.name,
        isWebhookAvailable: providerCourseLink.isWebhookAvailable,
        timeZoneCorrection: courses.timezoneCorrection,
        providerCourseConfiguration: providerCourseLink.providerCourseConfiguration,
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
        this.logger.error(err);
        throw new Error(`Error finding tee time id`);
      });
    if (!teeTime) {
      this.logger.fatal(`tee time not found id: ${teeTimeId}`);
      throw new Error(`Error finding tee time id`);
    }

    console.log(`Retrieving provider and token ${teeTime.internalId}, ${teeTime.courseId}`);
    let booking: BookingResponse | null = null;
    let teeProvider: ProviderAPI | null = null;
    let teeToken: string | null = null;
    try {
      const { provider, token } = await this.providerService.getProviderAndKey(
        teeTime.internalId!,
        teeTime.courseId,
        teeTime.providerCourseConfiguration!
      );
      teeProvider = provider;
      teeToken = token;
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
      if (!providerCustomer?.playerNumber) {
        this.logger.error(`Error creating customer`);
        this.loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "ERROR CREATING CUSTOMER",
          stackTrace: `Error creating customer on provider for userId ${userId}`,
          additionalDetailsJSON: "Error creating customer",
        });
        throw new Error(`Error creating customer`);
      }

      const bookedPLayers: { accountNumber: number }[] = [
        {
          accountNumber: providerCustomer.playerNumber,
        },
      ];

      console.log(
        `Creating booking ${teeTime.providerDate}, ${teeTime.holes}, ${playerCount}, ${teeTime.providerCourseId}, ${teeTime.providerTeeSheetId}, ${token}`
      );
      let details = "GD Booking";
      try {
        const isSensibleNoteAvailable = await appSettingService.get("SENSIBLE_NOTE_TO_TEE_SHEET");
        if (weatherQuoteId && isSensibleNoteAvailable) {
          details = `${details}: ${isSensibleNoteAvailable}`;
        }
      } catch (e) {
        console.log("ERROR in getting appsetting SENSIBLE_NOTE_TO_TEE_SHEET");
      }
      booking = await provider
        .createBooking(token, teeTime.providerCourseId!, teeTime.providerTeeSheetId!, {
          totalAmountPaid: primaryGreenFeeCharge / 100 + taxCharge - markupCharge,
          data: {
            type: "bookings",
            attributes: {
              start: teeTime.providerDate,
              holes: teeTime.holes,
              players: playerCount,
              bookedPlayers: bookedPLayers,
              event_type: "tee_time",
              details,
            },
          },
        })
        .catch((err) => {
          this.logger.error(err);
          this.loggerService.errorLog({
            userId: userId,
            url: "/reserveBooking",
            userAgent: "",
            message: "TEE TIME BOOKING FAILED ON PROVIDER",
            stackTrace: `first hand booking at provider failed for teetime ${teeTime.id}`,
            additionalDetailsJSON: err,
          });
          throw new Error(`Error creating booking`);
        });
    } catch (e) {
      console.log("BOOKING FAILED ON PROVIDER, INITIATING REFUND FOR PAYMENT_ID", payment_id);

      await this.hyperSwitchService.refundPayment(payment_id);

      const [user] = await this.database.select().from(users).where(eq(users.id, userId));
      if (!user) {
        this.logger.warn(`User not found: ${userId}`);
        throw new Error("User not found");
      }

      const template = {
        CustomerFirstName: user?.handle ?? user.name ?? "",
        CourseLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime?.cdnKey}.${teeTime?.extension}`,
        CourseURL: teeTime?.websiteURL || "",
        CourseName: teeTime?.courseName || "-",
        FacilityName: teeTime?.entityName || "-",
        PlayDateTime:
          dayjs(teeTime?.providerDate)
            .utcOffset(teeTime.timeZoneCorrection || "-06:00")
            .format("MM/DD/YYYY h:mm A") || "-",
        HeaderLogoURL: `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`,
      };
      await this.notificationService.createNotification(
        userId || "",
        "Refund Initiated",
        "Refund Initiated",
        teeTime?.courseId,
        process.env.SENDGRID_REFUND_EMAIL_TEMPLATE_ID ?? "d-79ca4be6569940cdb19dd2b607c17221",
        template
      );

      this.loggerService.auditLog({
        id: randomUUID(),
        userId,
        teeTimeId,
        bookingId: "",
        listingId: "",
        courseId: teeTime?.courseId,
        eventId: "REFUND_INITIATED",
        json: `{paymentId:${payment_id}}`,
      });

      throw "Booking failed on provider";
    }
    console.log(`Creating tokenized booking`);
    //create tokenized bookings
    const bookingId = await this.tokenizeService
      .tokenizeBooking(
        redirectHref,
        userId,
        pricePerGolfer,
        playerCount as number,
        booking.data.id,
        teeTimeId as string,
        paymentId as string,
        true,
        teeProvider,
        teeToken,
        teeTime,
        {
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
        },
        teeTime?.isWebhookAvailable ?? false
      )
      .catch(async (err) => {
        this.logger.error(err);
        //@TODO this email should be removed
        await this.notificationService.createNotification(
          userId,
          "Error creating booking",
          "An error occurred while creating booking with provider",
          teeTime.courseId
        );
        this.loggerService.errorLog({
          userId: userId,
          url: "/reserveBooking",
          userAgent: "",
          message: "TEE TIME BOOKING FAILED ON PROVIDER",
          stackTrace: `first hand booking at provider failed for teetime ${teeTime.id}`,
          additionalDetailsJSON: JSON.stringify(err),
        });
        throw new Error(`Error creating booking`);
      });

    await this.sendMessageToVerifyPayment(paymentId as string, userId, bookingId, redirectHref);
    return {
      bookingId,
      providerBookingId: booking.data.id,
      status: "Reserved",
    } as ReserveTeeTimeResponse;
  };

  confirmBooking = async (paymentId: string, userId: string) => {
    const [booking] = await this.database
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
        this.loggerService.auditLog({
          id: randomUUID(),
          userId,
          teeTimeId: booking?.teeTimeId ?? "",
          bookingId: booking?.bookingId ?? "",
          listingId: "",
          courseId: booking?.courseId ?? "",
          eventId: "TEE_TIME_CONFIRMATION_FAILED",
          json: err,
        });
        this.logger.error(`Error retrieving bookings by payment id: ${err}`);
        throw "Error retrieving booking";
      });
    if (!booking) {
      // TODO: need to refund the payment.
      console.log(`Booking not found for payment id ${paymentId}`);

      throw "Booking not found for payment id";
    } else {
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
          this.loggerService.errorLog({
            userId: userId,
            url: "/confirmBooking",
            userAgent: "",
            message: "ERROR CONFIRMING BOOKING",
            stackTrace: `error confirming booking id ${booking?.bookingId ?? ""} teetime ${booking?.teeTimeId ?? ""
              }`,
            additionalDetailsJSON: err,
          });
        });

      this.loggerService.auditLog({
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
  };
  reserveSecondHandBooking = async (
    userId = "",
    cartId = "",
    listingId = "",
    payment_id = "",
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
    } = await this.normalizeCartData({
      cartId,
      userId,
    });

    const isValid = await this.checkIfPaymentIdIsValid(payment_id);
    if (!isValid) {
      this.loggerService.auditLog({
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
        handle: users.handle,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();

    const bookingId = randomUUID();
    const bookingsToCreate: InsertBooking[] = [];
    const transfersToCreate: InsertTransfer[] = [];
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
      weatherGuaranteeAmount: sensibleCharge,
      weatherGuaranteeId: "",
      cartId: cartId,
      playerCount: associatedBooking?.listedSlotsCount ?? 0,
      greenFeePerPlayer: primaryGreenFeeCharge / (associatedBooking?.listedSlotsCount ?? 1) ?? 0,
      totalTaxesAmount: taxCharge * 100 || 0,
      charityId: charityId || null,
      totalCharityAmount: charityCharge * 100 || 0,
      totalAmount: total || 0,
      providerPaymentId: paymentId,
      weatherQuoteId: weatherQuoteId || null,
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
    });
    await this.database.transaction(async (tx) => {
      await tx
        .insert(bookings)
        .values(bookingsToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          tx.rollback();
        });

      await this.database
        .insert(transfers)
        .values(transfersToCreate)
        .execute()
        .catch((err) => {
          this.logger.error(err);
        });
    });
    await this.sendMessageToVerifyPayment(payment_id, userId, bookingId, redirectHref);

    this.loggerService.auditLog({
      id: randomUUID(),
      userId,
      teeTimeId: associatedBooking?.teeTimeIdForBooking ?? "",
      bookingId,
      listingId,
      courseId: cart?.courseId ?? "",
      eventId: "TEE_TIME_BOOKED",
      json: "Tee time booked",
    });

    return {
      bookingId,
      providerBookingId: "",
      status: "Reserved",
    } as ReserveTeeTimeResponse;
  };

  getOwnedBookingById = async (userId: string, bookingId: string) => {
    const [booking] = await this.database
      .select({
        providerId: bookings.providerBookingId,
        playTime: teeTimes.providerDate,
        transferedFromBookingId: transfers.fromUserId,
      })
      .from(bookings)
      .innerJoin(transfers, eq(transfers.bookingId, bookings.id))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .where(and(eq(bookings.ownerId, userId), eq(bookings.id, bookingId)))
      .execute()
      .catch((err) => {
        this.logger.error(`Error retrieving bookings by payment id: ${err}`);
        throw "Error retrieving booking";
      });
    if (booking && booking?.transferedFromBookingId !== "0x000") {
      booking.providerId = "";
    }
    return booking;
  };
}

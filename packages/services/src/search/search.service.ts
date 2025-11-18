import type { SQL } from "@golf-district/database";
import {
  and,
  asc,
  between,
  desc,
  eq,
  gt,
  gte,
  isNull,
  like,
  lt,
  lte,
  min,
  or,
  sql,
  type Db,
  inArray,
} from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import { courseAllowedTimeToSell } from "@golf-district/database/schema/courseAllowedTimeToSell";
import { courseMarkup } from "@golf-district/database/schema/courseMarkup";
import { courses } from "@golf-district/database/schema/courses";
import { favorites } from "@golf-district/database/schema/favorites";
import { lists } from "@golf-district/database/schema/lists";
import { majorEvents } from "@golf-district/database/schema/majorEvents";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { users } from "@golf-district/database/schema/users";
import type { CombinedObject, SearchObject } from "@golf-district/shared";
import { addDays, TeeTimeType, type IconCodeType } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { cacheManager } from "@golf-district/shared/src/utils/cacheManager";
import { add, isSameDay, parseISO } from "date-fns";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { CacheService } from "../infura/cache.service";
import { type ProviderService } from "../tee-sheet-provider/providers.service";
import type { Forecast } from "../weather/types";
import type { WeatherService } from "../weather/weather.service";
import { loggerService } from "../webhooks/logging.service";
import { courseSetting } from "@golf-district/database/schema/courseSetting";
import { courseAdvancedBookingFee } from "@golf-district/database/schema/courseAdvancedBookingFee";

dayjs.extend(UTC);
dayjs.extend(customParseFormat);

interface TeeTimeSearchObject {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  greenFeeTaxPerPlayer: number;
  cartFeeTaxPerPlayer: number;
  greenFee: number;
  cartFee: number;
  teeTimeId: string;
  date: string; //day of tee time
  time: number; //military time
  includesCart: boolean;
  firstOrSecondHandTeeTime: TeeTimeType;
  isListed: boolean; //false if the booking is unlisted
  userWatchListed: boolean;
  numberOfWatchers: number;
  markupFees: number;
  watchers: {
    userId: string;
    handle: string;
    image: string;
  }[];
  weather: {
    temperature: number;
    shortForecast: string;
    name: string;
    iconCode: IconCodeType;
  };
  listingId?: string;
  bookingIds?: string[];
  minimumOfferPrice?: number;
  firstHandPurchasePrice?: number;
  greenFeeTaxPercent: number;
  cartFeeTaxPercent: number;
  weatherGuaranteeTaxPercent: number;
  markupTaxPercent: number;
  pricePerGolferForGroup?: number;
  merchandiseTaxPercent: number;
  advancedBookingFeesPerPlayer?: number;
}

interface MarkupData {
  toDay: number;
  fromDay: number;
  markUp: number;
}

interface AdvancedBookingFeeData {
  toDay: number;
  fromDay: number;
  advancedBookingFeePerPlayer: number;
}

interface CheckTeeTimesAvailabilityParams {
  dates: string[];
  courseId: string;
  startTime: number;
  endTime: number;
  minDate: string;
  maxDate: string;
  holes: 9 | 18;
  golfers: 1 | 2 | 3 | 4 | -1;
  showUnlisted: boolean;
  includesCart: boolean;
  lowerPrice: number;
  upperPrice: number;
  take: number;
  sortTime: "asc" | "desc" | "";
  sortPrice: "asc" | "desc" | "";
  timezoneCorrection: number;
  cursor?: number | null;
  isHolesAny?: boolean;
  isGolferAny?: boolean;
  highestPrice?: number;
  lowestPrice?: number;
  _userId: string | undefined;
}

interface EventLogo {
  key: string;
  extension: string;
  cdn: string;
}

interface SpecialEvent {
  id: string;
  eventName: string;
  startDate: string;
  endDate: string;
  eventStartDate: string | null;
  eventEndDate: string | null;
  logo: EventLogo;
  iconUrl: string | null;
}

type Day = {
  year: number;
  month: number;
  day: number;
};
type TeeTimeRow = {
  teeDate: string;
};

type PriceForecast = {
  courseId: string;
  name: string;
  providerDate: string;
  EarlyMorning: number | null;
  MidMorning: number | null;
  EarlyAfternoon: number | null;
  Afternoon: number | null;
  Twilight: number | null;
};

interface TeeTimeForGroup {
  id: string;
  providerTeeTimeId: string;
  date: string;
  providerDate: string;
  time: number;
  numberOfHoles: number;
  maxPlayersPerBooking: number;
  availableFirstHandSpots: number;
  availableSecondHandSpots: number;
  greenFeePerPlayer: number;
  cartFeePerPlayer: number;
  greenFeeTaxPerPlayer: number;
  cartFeeTaxPerPlayer: number;
  courseId: string;
  createdDateTime: string;
  lastUpdatedDateTime: string;
}

interface TeeTimeGroup {
  teeTimes: TeeTimeForGroup[];
  time: number;
  pricePerGolfer: number;
  teeTimeIds: string[];
  date: string;
}

/**
 * Service for searching users and retrieving tee time listings.
 */
export class SearchService extends CacheService {
  protected readonly logger = Logger(SearchService.name);

  /**
   * Constructs a new SearchService.
   * @param {Db} database - The database instance for queries.
   * @param {WeatherService} weatherService - The weather service instance.
   * @param {ProviderService} providerService - The provider service instance.
   */
  constructor(
    private readonly database: Db,
    private readonly weatherService: WeatherService,
    private readonly providerService: ProviderService,
    redisUrl: string,
    redisToken: string
  ) {
    super(redisUrl, redisToken, Logger(SearchService.name));
  }

  findBlackoutDates = async (courseId: string): Promise<Day[]> => {
    // Generate a range of dates for the next 365 days
    const dates = Array.from({ length: 365 }, (_, i) => addDays(new Date(), i));

    const statement = sql`
    SELECT DISTINCT DATE(date) as teeDate
    FROM ${teeTimes}
    WHERE courseId = ${courseId}
      AND date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 365 DAY)
    ORDER BY DATE(date);
  `;
    const result = await this.database.execute(statement);

    const existingTeeTimes = (result.rows as TeeTimeRow[])
      .sort((a, b) => new Date(a.teeDate).getTime() - new Date(b.teeDate).getTime())
      .slice(0, result.rows.length - 1);

    const formattedTeeTimes = existingTeeTimes.map((row) => parseISO(row.teeDate));
    const blackoutDates = dates.filter(
      (date) => !formattedTeeTimes.some((teeTime) => isSameDay(date, teeTime))
    );

    // Format the result
    return blackoutDates.map((date) => ({
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
    }));
  };

  /**
   * Searches for users based on handle or email.
   * @param {string} searchText - The search text to filter users.
   * @returns {Promise<Array<{ id: string; handle: string; name: string; email: string }>>} - An array of sanitized user objects.
   */
  searchUsers = async (searchText: string) => {
    const data = await this.database
      .select({
        id: users.id,
        handle: users.handle,
        email: users.email,
        name: users.name,
      })
      .from(users)
      .where(or(like(users.handle, `${searchText}%`), like(users.email, `%${searchText}%`)))
      .limit(5)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/SearchService/searchUsers",
          userAgent: "",
          message: "ERROR_GETTING_USERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            searchText,
          }),
        });
        return [];
      });
    if (!data) {
      return [];
    }
    //sanitize data and return
    return data.map((user) => {
      return {
        id: user.id,
        handle: user.handle ? user.handle : "not found",
        name: user.name ? this.sanitizeHandle(user.name) : "not found",
        email: user.email ? this.sanitizeEmail(user.email) : "not found",
        emailOrPhoneNumber: user.email ? user.email : "not found",
      };
    });
  };

  /**
   * Retrieves unlisted tee times for a given owner and tee time ID.
   * @param {string} ownerId - The ID of the owner.
   * @param {string} teeTimeId - The ID of the tee time.
   * @param {string} [_userId] - Optional user ID for additional context.
   * @returns {Promise<SearchObject | null>} - Information about the unlisted tee time or null if not found.
   */
  getUnlistedTeeTimes = async (ownerId: string, teeTimeId: string, _userId?: string) => {
    let userId = "00000000-0000-0000-0000-000000000000";
    if (_userId) {
      userId = _userId;
    }
    const unlistedBookingData = await this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        teeTimeId: bookings.teeTimeId,
        time: teeTimes.time,
        date: teeTimes.providerDate,
        numberOfHoles: bookings.numberOfHoles,
        courseName: courses.name,
        courseId: teeTimes.courseId,
        withCart: bookings.includesCart,
        ownerHandle: users.handle,
        favorites: favorites.id,
        firstHandPrice: teeTimes.greenFeePerPlayer,
        minimumOfferPrice: bookings.minimumOfferPrice,
        purchasedFor: bookings.totalAmount,
        golfers: bookings.nameOnBooking,
        profilePicture: {
          key: assets.key,
          extension: assets.extension,
        },
        cartFee: bookings.cartFeePerPlayer,
        groupId: bookings.groupId,
        totalMerchandiseAmount: bookings.totalMerchandiseAmount,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.ownerId))
      .leftJoin(assets, eq(assets.id, users.image))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, bookings.teeTimeId), eq(favorites.userId, userId)))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(
        and(
          eq(bookings.ownerId, ownerId),
          eq(bookings.teeTimeId, teeTimeId),
          eq(bookings.isListed, false),
          eq(bookings.isActive, true)
        )
      )
      .execute();
    const firstBooking = unlistedBookingData[0];
    if (!unlistedBookingData || !firstBooking?.courseId || !firstBooking.date) {
      return null;
    }
    const forecast = await this.weatherService.getForecast(firstBooking.courseId).catch((err) => {
      this.logger.error(`error getting forecast, ${err}`);
      loggerService.errorLog({
        userId,
        url: "/SearchService/getUnlistedTeeTimes",
        userAgent: "",
        message: "ERROR_GETTING_FORECAST",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          ownerId,
          teeTimeId,
        }),
      });
      return [];
    });
    let weather;
    if (forecast) {
      const teeTimeDate = new Date(firstBooking.date);
      weather = this.matchForecastToTeeTime(teeTimeDate, forecast);
    }
    const res = {
      soldById: ownerId,
      soldByName: firstBooking.ownerHandle ? firstBooking.ownerHandle : "Anonymous",
      soldByImage: firstBooking.profilePicture
        ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${firstBooking.profilePicture.key}.${firstBooking.profilePicture.extension}`
        : "/defaults/default-profile.webp",
      availableSlots: unlistedBookingData.length,
      pricePerGolfer: 0,
      teeTimeId: teeTimeId,
      date: firstBooking.date,
      time: firstBooking.time ? firstBooking.time : 2400,
      userWatchListed: firstBooking.favorites ? true : false,
      includesCart: firstBooking.withCart ? firstBooking.withCart : false,
      firstOrSecondHandTeeTime: TeeTimeType.UNLISTED,
      isListed: false,
      minimumOfferPrice: firstBooking?.minimumOfferPrice ?? 0,
      firstHandPrice: firstBooking?.firstHandPrice ?? 0,
      golfers: [firstBooking?.golfers] ?? [],
      purchasedFor: firstBooking?.purchasedFor ?? 0,
      bookings: unlistedBookingData.map((booking) => {
        return booking.id;
      }),
      weather: weather ? weather : null,
      groupId: firstBooking.groupId,
      totalMerchandiseAmount: firstBooking?.totalMerchandiseAmount ?? 0,
    };
    return res;
  };

  /**
   * Retrieves tee time listing information by ID.
   * @param {string} listingId - The ID of the tee time listing.
   * @param {string} [_userId] - Optional user ID for additional context.
   * @returns {Promise<SearchObject | null>} - Information about the tee time listing or null if not found.
   */
  getListingById = async (listingId: string, _userId?: string) => {
    let userId = "00000000-0000-0000-0000-000000000000";
    if (_userId) {
      userId = _userId;
    }
    const data = await this.database
      .select({
        id: lists.id,
        teeTimeId: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.providerDate,
        numberOfHoles: teeTimes.numberOfHoles,
        listPrice: lists.listPrice,
        listedSlots: lists.slots,
        courseName: courses.name,
        ownerHandle: users.handle,
        ownerId: users.id,
        bookingId: bookings.id,
        favorites: favorites.id,
        includesCart: bookings.includesCart,
        firstHandPrice: teeTimes.greenFeePerPlayer,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
        image: {
          key: assets.key,
          extension: assets.extension,
        },
        minimumOfferPrice: bookings.minimumOfferPrice,
        groupId: bookings.groupId,
        allowSplit: lists.allowSplit,
        totalMerchandiseAmount: bookings.totalMerchandiseAmount,
      })
      .from(lists)
      .where(eq(lists.id, listingId))
      .leftJoin(bookings, eq(bookings.listId, lists.id))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(users, eq(users.id, bookings.ownerId))
      .leftJoin(assets, eq(assets.id, users.image))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, bookings.teeTimeId), eq(favorites.userId, userId)))
      .execute();
    const firstBooking = data[0];
    if (!data || !firstBooking?.courseId || !firstBooking.date) {
      return null;
    }
    const forecast = await this.weatherService.getForecast(firstBooking.courseId);
    const teeTimeDate = new Date(firstBooking.date);
    const weather = this.matchForecastToTeeTime(teeTimeDate, forecast);
    const res: SearchObject = {
      soldById: firstBooking.ownerId,
      soldByName: firstBooking.ownerHandle ? firstBooking.ownerHandle : "Anonymous",
      soldByImage: firstBooking.image
        ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${firstBooking.image.key}.${firstBooking.image.extension}`
        : "/defaults/default-profile.webp",
      availableSlots: firstBooking.listedSlots,
      pricePerGolfer: Number((firstBooking.listPrice * (1 + firstBooking.buyerFee / 100)) / 100),
      firstHandPurchasePrice: firstBooking.firstHandPrice ?? 0,
      teeTimeId: firstBooking.teeTimeId ? firstBooking.teeTimeId : "",
      date: firstBooking.date,
      time: firstBooking.time ? firstBooking.time : 2400,
      userWatchListed: firstBooking.favorites ? true : false,
      includesCart: firstBooking.includesCart ? firstBooking.includesCart : false,
      firstOrSecondHandTeeTime: TeeTimeType.SECOND_HAND,
      isListed: true,
      weather,
      minimumOfferPrice: firstBooking?.minimumOfferPrice ?? 0,
      ownerId: firstBooking.ownerId,
      groupId: firstBooking.groupId ?? "",
      allowSplit: firstBooking.allowSplit,
      totalMerchandiseAmount: firstBooking.totalMerchandiseAmount ?? 0,
    };
    return res;
  };

  /**
   * Retrieves tee time information by ID.
   * @param {string} teeTimeId - The ID of the tee time.
   * @param {string} [_userId] - Optional user ID for additional context.
   * @returns {Promise<SearchObject | null>} - Information about the tee time or null if not found.
   * @example
   * const teeTimeInfo = await searchService.getTeeTimeById("yourTeeTimeId", "optionalUserId");
   */

  getTeeTimeById = async (teeTimeId: string, _userId?: string) => {
    let userId = "00000000-0000-0000-0000-000000000000";
    if (_userId) {
      userId = _userId;
    }
    const [teeTIME] = await this.database.select().from(teeTimes).where(eq(teeTimes.id, teeTimeId)).execute();
    const [tee] = await this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.date,
        numberOfHoles: teeTimes.numberOfHoles,
        firstPartySlots: teeTimes.availableFirstHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        cartFee: teeTimes.cartFeePerPlayer,
        courseName: courses.name,
        markupFeesFixedPerPlayer: courses.markupFeesFixedPerPlayer,
        favorites: favorites.id,
        providerDate: teeTimes.providerDate,
        greenFeeTax: teeTimes.greenFeeTaxPerPlayer,
        cartFeeTax: teeTimes.cartFeeTaxPerPlayer,
        numberOfWatchers: sql<number>`(
          SELECT COUNT(*)
          FROM ${favorites}
          WHERE ${favorites.teeTimeId} = ${teeTimes.id}
        )`,
        logo: {
          key: assets.key,
          extension: assets.extension,
        },
        timezoneCorrection: courses.timezoneCorrection,
        greenFeeTaxPercent: courses.greenFeeTaxPercent,
        cartFeeTaxPercent: courses.cartFeeTaxPercent,
        weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
        markupTaxPercent: courses.markupTaxPercent,
        merchandiseTaxPercent: courses.merchandiseTaxPercent,
      })
      .from(teeTimes)
      .where(eq(teeTimes.id, teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      // .leftJoin(assets, and(eq(assets.courseId, teeTimes.courseId), eq(assets.id, courses.logoId)))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, teeTimes.id), eq(favorites.userId, userId)))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId,
          url: "/SearchService/getTeeTimeById",
          userAgent: "",
          message: "ERROR_GETTING_TEE_TIMES",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            teeTimeId,
            userId,
          }),
        });
        return [];
      });
    if (!tee) {
      return null;
    }
    const date = this.formatDateToAppropriateFormat(tee?.providerDate);
    const priceAccordingToDate: any[] = await this.getTeeTimesPriceWithRange(
      tee?.courseId,
      tee?.timezoneCorrection
    );
    const filteredDate: any[] = [];

    priceAccordingToDate.forEach((el) => {
      if (
        dayjs(el.toDayFormatted).isAfter(date) &&
        dayjs(el.fromDayFormatted).isBefore(date) &&
        !filteredDate.length
      ) {
        filteredDate.push(el);
        return;
      }
    });

    const advancedBookingFeeAccordingToDate: any[] = await this.getTeeTimesAdvancedFeeWithRange(
      tee?.courseId,
      tee?.timezoneCorrection
    );
    const filteredAdvancedFees: any[] = [];

    advancedBookingFeeAccordingToDate.forEach((el) => {
      if (
        dayjs(el.toDayFormatted).isAfter(date) &&
        dayjs(el.fromDayFormatted).isBefore(date) &&
        !filteredAdvancedFees.length
      ) {
        filteredAdvancedFees.push(el);
        return;
      }
    });

    // const date = dayjs(tee?.providerDate).utc();
    // const dateWithTimezone = date.add(tee?.timezoneCorrection).toString();
    // priceAccordingToDate.forEach((el) => {
    //   if (
    //     dayjs(el.toDayFormatted).isAfter(dateWithTimezone) &&
    //     dayjs(el.fromDayFormatted).isBefore(dateWithTimezone) &&
    //     !filteredDate.length
    //   ) {
    //     filteredDate.push(el);
    //     return;
    //   }
    // });

    const markupFeesFinal = filteredDate.length ? filteredDate[0].markUpFees : tee.markupFeesFixedPerPlayer;
    const advancedBookingFeesPerPlayer = filteredAdvancedFees.length
      ? filteredAdvancedFees[0].advancedBookingFeePerPlayer
      : 0;
    const advancedBookingFeesPerPlayerDecimal = advancedBookingFeesPerPlayer / 100;
    const markupFeesToBeUsed = markupFeesFinal / 100;
    const watchers = await this.database
      .select({
        userId: favorites.userId,
        handle: users.handle,
        image: {
          key: assets.key,
          extension: assets.extension,
        },
      })
      .from(favorites)
      .innerJoin(users, eq(users.id, favorites.userId))
      .leftJoin(assets, eq(assets.id, users.image))
      .where(eq(favorites.teeTimeId, teeTimeId))
      .limit(10)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/SearchService/getTeeTimeById",
          userAgent: "",
          message: "ERROR_GETTING_WATCHERS",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            teeTimeId,
          }),
        });
        return [];
      });

    const forecast = await this.weatherService.getForecast(tee.courseId);
    const teeTimeDate = new Date(tee.date);
    const weather = this.matchForecastToTeeTime(teeTimeDate, forecast);
    const res: TeeTimeSearchObject = {
      soldById: tee.courseId,
      soldByName: tee.courseName ? tee.courseName : "Golf District",
      soldByImage: tee.logo
        ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${tee.logo.key}.${tee.logo.extension}`
        : "/defaults/default-profile.webp",
      availableSlots: tee.firstPartySlots,
      pricePerGolfer:
        tee.greenFee / 100 + tee.cartFee / 100 + markupFeesToBeUsed + advancedBookingFeesPerPlayerDecimal,
      markupFees: markupFeesToBeUsed * 100,
      greenFeeTaxPerPlayer: tee.greenFeeTax,
      cartFeeTaxPerPlayer: tee.cartFeeTax,
      greenFee: tee.greenFee + advancedBookingFeesPerPlayer,
      cartFee: tee.cartFee,
      teeTimeId: tee.id,
      userWatchListed: tee.favorites ? true : false,
      date: tee.providerDate, //day of tee time
      time: tee.time, //military time
      includesCart: true,
      firstOrSecondHandTeeTime: TeeTimeType.FIRST_HAND,
      isListed: false,
      numberOfWatchers: tee.numberOfWatchers,
      watchers: watchers.map((watcher) => {
        return {
          userId: watcher.userId,
          handle: watcher.handle ? watcher.handle : "Anonymous",
          image: watcher.image
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${watcher.image.key}.${watcher.image.extension}`
            : "/defaults/default-profile.webp",
        };
      }),
      weather,
      greenFeeTaxPercent: tee.greenFeeTaxPercent,
      cartFeeTaxPercent: tee.cartFeeTaxPercent,
      weatherGuaranteeTaxPercent: tee.weatherGuaranteeTaxPercent,
      markupTaxPercent: tee.markupTaxPercent,
      merchandiseTaxPercent: tee.merchandiseTaxPercent ?? 0,
      advancedBookingFeesPerPlayer: advancedBookingFeesPerPlayer ?? 0,
    };
    return res;
  };

  /**
   * Initializes search parameters for tee times.
   * @param {string} startDate - The start date for the search.
   * @param {Date | null} [cursor=null] - Optional cursor date for pagination.
   * @param {string} [userId] - Optional user ID for additional context.
   * @returns {{ searchStartDate: Date; searchEndDate: Date; userId: string }} - Search parameters.
   * @example
   * const searchParams = searchService.initializeSearchParameters("2023-01-01", new Date(), "optionalUserId");
   */
  initializeSearchParameters = (startDate: string, cursor: Date | null = null, userId?: string) => {
    const searchStartDate = new Date(startDate);
    let searchEndDate = cursor ? new Date(cursor) : new Date(searchStartDate);

    if (!cursor) {
      searchEndDate = addDays(searchEndDate, 10);
    } else {
      searchEndDate = addDays(searchEndDate, 3);
    }

    userId = userId ?? "00000000-0000-0000-0000-000000000000";

    return { searchStartDate, searchEndDate, userId };
  };

  /**
   * Retrieves the last tee time date for a given course.
   * @param {string} courseId - The ID of the course.
   * @returns {Promise<Date | null>} - The last tee time date or null if not found.
   * @example
   * const lastTeeTimeDate = await searchService.getLastTeeTimeDate("yourCourseId");
   */
  async getLastTeeTimeDate(courseId: string) {
    const lastTeeTimeDate = await this.database
      .select({ date: teeTimes.date })
      .from(teeTimes)
      .where(eq(teeTimes.courseId, courseId))
      .orderBy(desc(teeTimes.date), desc(teeTimes.time))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/SearchService/getLastTeeTimeDate",
          userAgent: "",
          message: "ERROR_GETTING_LAST_TEE_TIME_DATE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        return [];
      });

    return lastTeeTimeDate?.[0] ? new Date(lastTeeTimeDate[0].date) : null;
  }

  /**
   * Matches forecast data to a tee time based on date.
   * @param {Date} teeTimeDate - The date of the tee time.
   * @param {Forecast[]} forecastData - Array of forecast data.
   * @returns {{ temperature: number; shortForecast: string; name: string; iconCode: IconCodeType }} - Matched weather data.
   * @example
   * const weatherData = searchService.matchForecastToTeeTime(new Date(), yourForecastArray);
   */
  matchForecastToTeeTime(teeTimeDate: Date, forecastData: Forecast[]) {
    const matchingForecast = forecastData.find((forecast) => {
      const forecastStartTime = new Date(forecast.startTime);
      const forecastEndTime = new Date(forecast.endTime);
      return teeTimeDate >= forecastStartTime && teeTimeDate < forecastEndTime;
    });

    let weather = {
      temperature: 0,
      shortForecast: "",
      name: "",
      iconCode: "" as IconCodeType,
    };

    if (matchingForecast) {
      weather = {
        temperature: matchingForecast.temperature,
        shortForecast: matchingForecast.shortForecast,
        name: matchingForecast.name,
        iconCode: matchingForecast.iconCode as IconCodeType,
      };
    }

    return weather;
  }

  async getWeatherForDay(courseId: string, date: string) {
    if (!date || !courseId) return null;
    const forecast = await this.weatherService.getForecast(courseId);
    const dateObj = dayjs.utc(date);
    const weather = forecast.find((i) => {
      return dateObj.isSame(dayjs.utc(i.startTime), "day");
    });
    return weather ?? null;
  }

  async getFarthestTeeTimeDate(courseId: string, order: "asc" | "desc") {
    const startOfToday = dayjs().utc().hour(0).minute(0).second(0).millisecond(0).toISOString();

    const teeTimeDate = await this.database
      .select({ date: teeTimes.providerDate })
      .from(teeTimes)
      .where(and(eq(teeTimes.courseId, courseId), gte(teeTimes.date, startOfToday)))
      .orderBy(order === "asc" ? asc(teeTimes.providerDate) : desc(teeTimes.providerDate))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/SearchService/searchUsers",
          userAgent: "",
          message: "ERROR_GETTING_FARTHEST_TEE_TIME_DATE",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            courseId,
          }),
        });
        return [];
      });

    return teeTimeDate?.[0]?.date ?? "";
  }

  formatDateToAppropriateFormat = (dateString: string) => {
    const date = new Date(dateString);
    const rfc2822Date = date.toUTCString();
    return rfc2822Date;
  };

  convertDateFormat(dateString: string) {
    const parsedDate = dayjs.utc(dateString, "ddd, DD MMM YYYY HH:mm:ss [GMT]");
    const formattedDate = parsedDate.format("YYYY-MM-DDTHH:mm:ss");
    return formattedDate;
  }
  sortDates = (dateArray: string[]) => {
    // Convert date strings to Date objects
    const dateObjects: Date[] = dateArray.map((dateStr) => new Date(dateStr));

    // Sort Date objects
    dateObjects.sort((a, b) => a.getTime() - b.getTime());

    // Convert Date objects back to strings in the same format
    const sortedDateStrings: string[] = dateObjects.map((dateObj) => dateObj.toUTCString());

    return sortedDateStrings;
  };

  async checkTeeTimesAvailabilityForDateRange({
    dates,
    courseId,
    startTime,
    endTime,
    minDate,
    maxDate,
    holes,
    golfers,
    showUnlisted,
    includesCart,
    lowerPrice,
    upperPrice,
    take,
    sortTime,
    sortPrice,
    timezoneCorrection,
    cursor,
    isHolesAny,
    isGolferAny,
    highestPrice,
    lowestPrice,
    _userId,
  }: CheckTeeTimesAvailabilityParams) {
    const res: string[] = [];
    const userId = _userId ?? "00000000-0000-0000-0000-000000000000";
    // const minDateSubquery = dayjs(minDate).utc().hour(0).minute(0).second(0).millisecond(0).toISOString();
    // const maxDateSubquery = dayjs(maxDate)
    //   .utc()
    //   .hour(23)
    //   .minute(59)
    //   .second(59)
    //   .millisecond(999)
    //   .toISOString();
    //   console.log(minDateSubquery,maxDateSubquery,"maxDateSubquerymaxDateSubquerymaxDateSubquery")
    const minDateSubquery = this.convertDateFormat(minDate);
    const maxDateSubquery = this.convertDateFormat(maxDate);

    // .utc()
    // .hour(23)
    // .minute(59)
    // .second(59)
    // .millisecond(999)
    // .toISOString();
    // const startDate = dayjs(minDateSubquery).utc().hour(0).minute(0).second(0).millisecond(0).toISOString();
    // const endDate = dayjs(maxDateSubquery)
    //   .utc()
    //   .hour(23)
    //   .minute(59)
    //   .second(59)
    //   .millisecond(999)
    //   .toISOString();

    const cacheKey = `${courseId}-NumberOfPlayers`;
    const cacheTTL = 600;

    // const nowInCourseTimezone = dayjs().utc().utcOffset(timezoneCorrection).format("YYYY-MM-DD HH:mm:ss");
    // const currentTimePlus30Min = dayjs
    //   .utc(nowInCourseTimezone)
    //   .utcOffset(timezoneCorrection)
    //   .add(30, "minutes")
    //   .toISOString();
    // Allowed Players start

    let NumberOfPlayers: any = await cacheManager.get(cacheKey);

    if (!NumberOfPlayers) {
      NumberOfPlayers = await this.database
        .select({
          primaryMarketAllowedPlayers: courses.primaryMarketAllowedPlayers,
          // openTime: courses.openTime,
          // closeTime: courses.closeTime,
          openTime: courses.courseOpenTime,
          closeTime: courses.courseCloseTime,
        })
        .from(courses)
        .where(eq(courses.id, courseId));

      await cacheManager.set(cacheKey, NumberOfPlayers, 600000);
    }

    const PlayersOptions = ["1", "2", "3", "4"];

    const binaryMask = NumberOfPlayers[0]?.primaryMarketAllowedPlayers;

    const numberOfPlayers =
      binaryMask !== null && binaryMask !== undefined
        ? PlayersOptions.filter((_, index) => (binaryMask & (1 << index)) !== 0)
        : [];
    const playersCount = numberOfPlayers?.[0] ? Number(numberOfPlayers[0]) : golfers;

    const conditions: SQL<unknown>[] = [];

    if (!isHolesAny) {
      conditions.push(eq(teeTimes.numberOfHoles, holes));
    }

    if (!isGolferAny) {
      conditions.push(gte(teeTimes.availableFirstHandSpots, playersCount));
    }

    // const startingHour = Number(NumberOfPlayers[0]?.openTime?.split(" ")?.[1]?.split(":")?.[0]) ?? 9;
    // const closingHour = Number(NumberOfPlayers[0]?.closeTime?.split(" ")?.[1]?.split(":")?.[0]) ?? 9;

    const startingHour = NumberOfPlayers[0]?.openTime ?? 9;
    const closingHour = NumberOfPlayers[0]?.closeTime ?? 9;

    if (startingHour !== startTime || closingHour !== endTime) {
      conditions.push(and(gte(teeTimes.time, startTime), lte(teeTimes.time, endTime)) as any);
    }

    const firstHandSpecificCondition: SQL<unknown>[] = [];
    const secondHandSpecificCondition: SQL<unknown>[] = [];

    if (highestPrice !== upperPrice || lowestPrice !== lowerPrice) {
      firstHandSpecificCondition.push(
        sql`(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})/100 >= ${lowerPrice}`
      );
      firstHandSpecificCondition.push(
        sql`(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})/100 <= ${upperPrice}`
      );
      secondHandSpecificCondition.push(
        sql`(${lists.listPrice}*(${courses.buyerFee}/100)+${lists.listPrice})/100 >= ${lowerPrice}`
      );
      secondHandSpecificCondition.push(
        sql`(${lists.listPrice}*(${courses.buyerFee}/100)+${lists.listPrice})/100 <= ${upperPrice}`
      );
    }

    const firstHandResultsQuery = this.database
      .selectDistinct({
        // providerDate: sql` DATE(Convert_TZ( ${teeTimes.providerDate}, 'UTC', ${courses?.timezoneISO} ))`,
        providerDate: sql`DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3))`,
      })
      .from(teeTimes)
      .innerJoin(courses, eq(courses.id, teeTimes.courseId));

    const courseAllowedTeeTimeToSellFilters = await this.database
      .select({
        fromTime: courseAllowedTimeToSell.fromTime,
        toTime: courseAllowedTimeToSell.toTime,
        primaryMarketAllowedPlayers: courseAllowedTimeToSell.primaryMarketAllowedPlayers,
      })
      .from(courseAllowedTimeToSell)
      .where(and(eq(courseAllowedTimeToSell.courseId, courseId)))
      .orderBy(asc(courseAllowedTimeToSell.fromTime));

    if (courseAllowedTeeTimeToSellFilters.length > 0) {
      firstHandResultsQuery
        .leftJoin(
          courseAllowedTimeToSell,
          and(
            eq(courseAllowedTimeToSell.courseId, teeTimes.courseId),
            eq(
              courseAllowedTimeToSell.day,
              sql`UPPER(DATE_FORMAT(DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3)), '%a'))`
            )
          )
        )
        .where(
          and(
            eq(courses.id, courseId),
            between(teeTimes.providerDate, minDateSubquery, maxDateSubquery),
            ...conditions,
            ...firstHandSpecificCondition,
            or(
              isNull(courseAllowedTimeToSell.courseId),
              and(
                gte(teeTimes.time, courseAllowedTimeToSell.fromTime),
                lte(teeTimes.time, courseAllowedTimeToSell.toTime)
              )
            )
          )
        )
        .orderBy(asc(sql`DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3))`));
    } else {
      firstHandResultsQuery
        .where(
          and(
            eq(courses.id, courseId),
            between(teeTimes.providerDate, minDateSubquery, maxDateSubquery),
            and(gt(teeTimes.greenFeePerPlayer, 0)),
            ...conditions,
            ...firstHandSpecificCondition
          )
        )
        .orderBy(asc(sql`DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3))`));
    }

    // console.log("DATES QUERY:", firstHandResultsQuery.toSQL())

    const firstHandResults = await firstHandResultsQuery.execute();

    const secondHandResultsQuery = this.database
      .selectDistinct({
        providerDate: sql`DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3))`,
      })
      .from(lists)
      .innerJoin(bookings, eq(bookings.listId, lists.id))
      .innerJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(
        and(
          eq(courses.id, courseId),
          between(teeTimes.providerDate, minDateSubquery, maxDateSubquery),
          eq(lists.isDeleted, false),
          ...conditions,
          ...secondHandSpecificCondition
        )
      )
      .orderBy(asc(sql`DATE(SUBSTRING_INDEX(${teeTimes.providerDate}, '-', 3))`));

    const secondHandResults = await secondHandResultsQuery.execute();
    const firstHandAndSecondHandResult = [...firstHandResults, ...secondHandResults];
    const firstHandAndSecondHandResultDates = firstHandAndSecondHandResult.map((el) =>
      this.formatDateToAppropriateFormat(el.providerDate as string)
    );
    const uniqueSetfirstHandAndSecondHandResultDates = new Set(firstHandAndSecondHandResultDates);
    const uniqueArrayfirstHandAndSecondHandResultDates = Array.from(
      uniqueSetfirstHandAndSecondHandResultDates
    );
    return this.sortDates(uniqueArrayfirstHandAndSecondHandResultDates);
  }

  getTeeTimesPriceWithRange = async (
    courseId: string,
    timeZoneCorrection: number
  ): Promise<{ toDayFormatted: string; fromDayFormatted: string; markUpFees: number }[]> => {
    const markupCacheKey = `${courseId}-markup`;

    let markupData: MarkupData[] | null = await cacheManager.get(markupCacheKey);

    if (!markupData) {
      const dbResult = await this.database
        .select()
        .from(courseMarkup)
        .where(eq(courseMarkup.courseId, courseId))
        .execute();

      // Assuming dbResult is an array of MarkupData
      markupData = dbResult as MarkupData[];
      await cacheManager.set(markupCacheKey, markupData, 600000);
    }

    if (!Array.isArray(markupData)) {
      throw new Error("Invalid markup data format");
    }

    const currentDate = dayjs();
    const currentdateWithTimeZone = currentDate.add(timeZoneCorrection ?? 0, "hour");
    const priceAccordingToDate: { toDayFormatted: string; fromDayFormatted: string; markUpFees: number }[] =
      [];

    markupData.forEach((el) => {
      const toDay = currentDate.add(el.toDay, "day");
      const fromDay = currentDate.add(el.fromDay, "day").set("hours", 0).set("minutes", 0).set("seconds", 0);

      priceAccordingToDate.push({
        // toDayFormatted: toDay.toString(),
        // fromDayFormatted: fromDay.toString(),
        toDayFormatted: toDay.format("ddd, DD MMM YYYY HH:mm:ss [GMT]"),
        fromDayFormatted: fromDay.format("ddd, DD MMM YYYY HH:mm:ss [GMT]"),
        markUpFees: el.markUp,
      });
    });

    return priceAccordingToDate;
  };

  getTeeTimesAdvancedFeeWithRange = async (
    courseId: string,
    timeZoneCorrection: number
  ): Promise<{ toDayFormatted: string; fromDayFormatted: string; advancedBookingFeePerPlayer: number }[]> => {
    const advancedBookingFeeCacheKey = `${courseId}-advancedBookingFees`;

    let advancedBookingFeeData: AdvancedBookingFeeData[] | null =
      await cacheManager.get(advancedBookingFeeCacheKey);

    if (!advancedBookingFeeData) {
      const dbResult = await this.database
        .select({
          toDay: courseAdvancedBookingFee.toDay,
          fromDay: courseAdvancedBookingFee.fromDay,
          advancedBookingFeePerPlayer: courseAdvancedBookingFee.advancedBookingFeePerPlayer,
        })
        .from(courseAdvancedBookingFee)
        .where(eq(courseAdvancedBookingFee.courseId, courseId))
        .execute();

      // Assuming dbResult is an array of AdvancedBookingFeesData
      advancedBookingFeeData = dbResult as AdvancedBookingFeeData[];
      await cacheManager.set(advancedBookingFeeCacheKey, advancedBookingFeeData, 600000);
    }

    if (!Array.isArray(advancedBookingFeeData)) {
      throw new Error("Invalid advanced booking data format");
    }

    const currentDate = dayjs();
    const currentdateWithTimeZone = currentDate.add(timeZoneCorrection ?? 0, "hour");
    const priceAccordingToDate: {
      toDayFormatted: string;
      fromDayFormatted: string;
      advancedBookingFeePerPlayer: number;
    }[] = [];

    advancedBookingFeeData.forEach((el) => {
      const toDay = currentDate.add(el.toDay, "day");
      const fromDay = currentDate.add(el.fromDay, "day").set("hours", 0).set("minutes", 0).set("seconds", 0);

      priceAccordingToDate.push({
        // toDayFormatted: toDay.toString(),
        // fromDayFormatted: fromDay.toString(),
        toDayFormatted: toDay.format("ddd, DD MMM YYYY HH:mm:ss [GMT]"),
        fromDayFormatted: fromDay.format("ddd, DD MMM YYYY HH:mm:ss [GMT]"),
        advancedBookingFeePerPlayer: el.advancedBookingFeePerPlayer,
      });
    });

    return priceAccordingToDate;
  };

  // getTeeTimesPriceWithRange = async (courseId: string, timeZoneCorrection: number) => {

  //   const markupCacheKey = `${courseId}-markup`;

  //   let markupData = await cacheManager.get(markupCacheKey)

  //   if(!markupData){

  //     markupData = await this.database
  //     .select()
  //     .from(courseMarkup)
  //     .where(eq(courseMarkup.courseId, courseId))
  //     .execute();

  //     await cacheManager.set(markupCacheKey, markupData, 600000);

  //   }

  //   const currentDate = dayjs();
  //   const currentdateWithTimeZone = currentDate.add(timeZoneCorrection ?? 0, "hour");
  //   const priceAccordingToDate: any[] = [];

  //   markupData.forEach((el) => {
  //     const toDay = currentdateWithTimeZone.add(el?.toDay, "day");
  //     const fromDay = currentdateWithTimeZone
  //       .add(el?.fromDay, "day")
  //       .set("hours", 0)
  //       .set("minutes", 0)
  //       .set("seconds", 0);
  //     priceAccordingToDate.push({
  //       toDayFormatted: toDay.toString(),
  //       fromDayFormatted: fromDay.toString(),
  //       markUpFees: el.markUp,
  //     });
  //   });
  //   return priceAccordingToDate;
  // };
  async getTeeTimesForDay(
    courseId: string,
    date: string,
    minDate: string,
    maxDate: string,
    startTime: number,
    endTime: number,
    holes: 9 | 18,
    golfers: number,
    showUnlisted: boolean,
    includesCart: boolean,
    lowerPrice: number,
    upperPrice: number,
    take = 5,
    sortTime: "asc" | "desc" | "",
    sortPrice: "asc" | "desc" | "",
    timezoneCorrection: number,
    cursor?: number | null,
    _userId?: string
  ) {
    const userId = _userId ?? "00000000-0000-0000-0000-000000000000";
    const limit = (cursor ?? 1) * take;

    const minDateSubquery = dayjs(minDate).utc().hour(0).minute(0).second(0).millisecond(0).toISOString();
    const maxDateSubquery = dayjs(maxDate)
      .utc()
      .hour(23)
      .minute(59)
      .second(59)
      .millisecond(999)
      .toISOString();
    console.log("=====>", minDateSubquery, maxDateSubquery);
    // const startDate = dayjs(date).utc().hour(0).minute(0).second(0).millisecond(0).toISOString();
    // const endDate = dayjs(date).utc().hour(23).minute(59).second(59).millisecond(999).toISOString();

    const today = dayjs(date).utc().startOf("day");
    const currentday = dayjs(minDate).utc().startOf("day");
    let startOfDay: any = "";
    if (currentday.isSame(today)) {
      startOfDay = this.convertDateFormat(minDate);
    } else {
      startOfDay = this.convertDateFormat(date);
    }
    const endOfDay = dayjs(date).utc().hour(23).minute(59).second(59).millisecond(999).toISOString();

    const nowInCourseTimezone = dayjs().utc().utcOffset(timezoneCorrection).format("YYYY-MM-DD HH:mm:ss");
    const currentTimePlus30Min = dayjs
      .utc(nowInCourseTimezone)
      .utcOffset(timezoneCorrection)
      .add(30, "minutes")
      .toISOString();

    const countSubQuery = this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.date,
        numberOfHoles: teeTimes.numberOfHoles,
        firstPartySlots: teeTimes.availableFirstHandSpots,
        secondHandSlots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        courseName: courses.name,
        cartFee: teeTimes.cartFeePerPlayer,
      })
      .from(teeTimes)
      .innerJoin(courses, eq(courses.id, courseId))
      .where(
        and(
          and(gte(teeTimes.time, startTime), lte(teeTimes.time, endTime)),
          between(
            sql`(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})/100`,
            lowerPrice,
            upperPrice
          ),
          between(teeTimes.providerDate, startOfDay, endOfDay),
          eq(teeTimes.courseId, courseId),
          //TODO: use isCartIncluded instead
          // includesCart ? gte(teeTimes.cartFeePerPlayer, 1) : eq(teeTimes.cartFeePerPlayer, 0),
          eq(teeTimes.numberOfHoles, holes),
          eq(teeTimes.numberOfHoles, holes),
          gt(teeTimes.availableFirstHandSpots, 0),
          or(gte(teeTimes.availableFirstHandSpots, golfers), gte(teeTimes.availableSecondHandSpots, golfers)),
          gt(teeTimes.greenFeePerPlayer, 0)
        )
      );
    const cacheKey = `${courseId}-NumberOfPlayers`;
    let NumberOfPlayers: any = await cacheManager.get(cacheKey);

    if (!NumberOfPlayers) {
      NumberOfPlayers = await this.database
        .select({
          primaryMarketAllowedPlayers: courses.primaryMarketAllowedPlayers,
          openTime: courses.openTime,
          closeTime: courses.closeTime,
          primaryMarketSellLeftoverSinglePlayer: courses.primaryMarketSellLeftoverSinglePlayer,
        })
        .from(courses)
        .where(eq(courses.id, courseId));

      await cacheManager.set(cacheKey, NumberOfPlayers, 600000);
    }

    // Filter specific tee times that can be sold
    const dayToFetch = dayjs(date)
      .utc()
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0)
      .format("ddd")
      .toUpperCase() as "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

    const courseAllowedTeeTimeToSellFilters = await this.database
      .select({
        fromTime: courseAllowedTimeToSell.fromTime,
        toTime: courseAllowedTimeToSell.toTime,
        primaryMarketAllowedPlayers: courseAllowedTimeToSell.primaryMarketAllowedPlayers,
        primaryMarketSellLeftoverSinglePlayer: courseAllowedTimeToSell.primaryMarketSellLeftoverSinglePlayer,
      })
      .from(courseAllowedTimeToSell)
      .where(and(eq(courseAllowedTimeToSell.courseId, courseId), eq(courseAllowedTimeToSell.day, dayToFetch)))
      .orderBy(asc(courseAllowedTimeToSell.fromTime))
      .execute();

    const hasCourseAllowedTeeTimeToSellFilters = courseAllowedTeeTimeToSellFilters.length > 0;

    const PlayersOptions = ["1", "2", "3", "4"];

    const binaryMask = hasCourseAllowedTeeTimeToSellFilters
      ? undefined
      : NumberOfPlayers[0]?.primaryMarketAllowedPlayers;
    const isSellingLeftoverSinglePlayer = NumberOfPlayers[0]?.primaryMarketSellLeftoverSinglePlayer;

    const numberOfPlayers =
      binaryMask !== null && binaryMask !== undefined
        ? PlayersOptions.filter((_, index) => (binaryMask & (1 << index)) !== 0)
        : PlayersOptions;
    const playersCount = numberOfPlayers?.[0] ? Number(numberOfPlayers[0]) : 0;
    // Allowed Players end

    const countQuery = this.database
      .select({
        value: sql`count('*')`.mapWith(Number),
      })
      .from(countSubQuery.as("subQuery"));

    const countCall = await countQuery;
    const firstHandCount = countCall[0]?.value ?? 0;

    const teeQuery = this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.date,
        providerDate: teeTimes.providerDate,
        numberOfHoles: teeTimes.numberOfHoles,
        firstPartySlots: teeTimes.availableFirstHandSpots,
        secondHandSlots: teeTimes.availableSecondHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        courseName: courses.name,
        markupFeesFixedPerPlayer: courses.markupFeesFixedPerPlayer,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
        cartFee: teeTimes.cartFeePerPlayer,
        logo: {
          key: assets.key,
          extension: assets.extension,
        },
        favoritesId: favorites.id,
      })
      .from(teeTimes)
      .innerJoin(courses, eq(courses.id, courseId))
      // .leftJoin(assets, and(eq(assets.courseId, teeTimes.courseId), eq(assets.id, courses.logoId)))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, teeTimes.id), eq(favorites.userId, userId)))
      .where(
        and(
          and(gte(teeTimes.time, startTime), lte(teeTimes.time, endTime)),
          between(
            sql`(${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer})/100`,
            lowerPrice,
            upperPrice
          ),
          between(teeTimes.providerDate, startOfDay, endOfDay),
          eq(teeTimes.courseId, courseId),
          eq(teeTimes.numberOfHoles, holes),
          gte(teeTimes.availableFirstHandSpots, golfers === -1 ? 1 : golfers),
          or(
            gte(teeTimes.availableFirstHandSpots, playersCount),
            ...(isSellingLeftoverSinglePlayer ? [eq(teeTimes.availableFirstHandSpots, 1)] : [])
          ),
          gt(teeTimes.greenFeePerPlayer, 0)
        )
      )
      .orderBy(
        sortPrice === "desc"
          ? desc(teeTimes.greenFeePerPlayer)
          : sortTime === "desc"
            ? desc(teeTimes.time)
            : sortPrice === "asc"
              ? asc(teeTimes.greenFeePerPlayer)
              : asc(teeTimes.time)
      );
    const teeQueryLimited = teeQuery.limit(limit);

    const cacheCourseDataKey = `${courseId}-course-data`;
    let courseData: any = await cacheManager.get(cacheCourseDataKey);
    if (!courseData) {
      courseData = await this.database
        .select({
          buyerFee: courses.buyerFee,
          sellerFee: courses.sellerFee,
          markupFees: courses.markupFeesFixedPerPlayer,
          timeZoneCorrection: courses.timezoneCorrection,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .execute()
        .catch(() => { });

      await cacheManager.set(cacheCourseDataKey, courseData, 600000);
    }

    let buyerFee = 0;
    let courseDataIfAvailable: any = {};
    if (courseData?.length) {
      buyerFee = (courseData[0]?.buyerFee ?? 1) / 100;
      courseDataIfAvailable = courseData[0];
    }

    let teeTimesData = await teeQueryLimited.execute().catch(async (err) => {
      await loggerService.errorLog({
        userId: _userId ?? "",
        url: `/${courseId}`,
        userAgent: "",
        message: "ERROR_GETTING_TEE_TIMES",
        stackTrace: `Error retrieving tee times where courseId: ${courseId}, date: ${date}, minDate:${minDate}, maxDate:${maxDate}, startTime:${startTime}, endTime:${endTime}, holes:${holes}, golfers:${golfers}`,
        additionalDetailsJSON: `Error getting tee times for ${date}: ${err}`,
      });
      this.logger.error(err);
      loggerService.errorLog({
        userId,
        url: "/SearchService/getTeeTimesForDay",
        userAgent: "",
        message: "ERROR_GETTING_TEE_TIMES_FOR_DAY",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          courseId,
          date,
          minDate,
          maxDate,
          startTime,
          endTime,
          holes,
          golfers,
          sortPrice,
          sortTime,
          limit,
          userId: _userId,
        }),
      });
      throw new Error(`Error getting tee times for ${date}: ${err}`);
    });

    teeTimesData.sort((a, b) => {
      if (b.greenFee === a.greenFee) {
        return a.time - b.time;
      }
      return a.greenFee - b.greenFee;
    });

    let innerCursor = 0;
    if (courseAllowedTeeTimeToSellFilters?.length > 0) {
      let newTeeTimeData = [] as typeof teeTimesData;
      let needToRepeat = false;
      innerCursor = 0;
      // console.log("FILTERING TEE TIMES");
      // console.log("teeTimesData", teeTimesData.length, limit);
      while (!(newTeeTimeData.length >= limit)) {
        const offset = limit + take * innerCursor;
        // console.log("COMING IN WHILE LOOP")
        let extraTimes = [] as typeof teeTimesData;
        if (needToRepeat) {
          // console.log("OFFSET: ", offset);
          // console.log("innerCursor: ", innerCursor);
          const extraTimesQuery = teeQuery.limit(take).offset(offset);

          // console.log("extraTimesQuery", extraTimesQuery.toSQL());

          extraTimes = await extraTimesQuery.execute().catch(async (err) => {
            await loggerService.errorLog({
              userId: _userId ?? "",
              url: `/${courseId}`,
              userAgent: "",
              message: "ERROR_GETTING_TEE_TIMES",
              stackTrace: `Error retrieving tee times where courseId: ${courseId}, date: ${date}, minDate:${minDate}, maxDate:${maxDate}, startTime:${startTime}, endTime:${endTime}, holes:${holes}, golfers:${golfers}`,
              additionalDetailsJSON: `Error getting tee times for ${date}: ${err}`,
            });
            this.logger.error(err);
            loggerService.errorLog({
              userId,
              url: "/SearchService/getTeeTimesForDay",
              userAgent: "",
              message: "ERROR_GETTING_TEE_TIMES_FOR_DAY",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                date,
                minDate,
                maxDate,
                startTime,
                endTime,
                holes,
                golfers,
                sortPrice,
                sortTime,
                limit,
                userId: _userId,
              }),
            });
            throw new Error(`Error getting tee times for ${date}: ${err}`);
          });
        }

        if (needToRepeat && !extraTimes?.length) {
          break;
        }
        if (needToRepeat) {
          for (const allowedTimeToSell of courseAllowedTeeTimeToSellFilters) {
            const binaryMask = allowedTimeToSell?.primaryMarketAllowedPlayers;
            const isSellingLeftoverSinglePlayer = allowedTimeToSell?.primaryMarketSellLeftoverSinglePlayer;
            // console.log("binaryMask", binaryMask);
            const numberOfPlayers =
              binaryMask !== null && binaryMask !== undefined
                ? PlayersOptions.filter((_, index) => (binaryMask & (1 << index)) !== 0)
                : PlayersOptions;
            // console.log("numberOfPlayers", numberOfPlayers);
            const playersCount = numberOfPlayers?.[0] ? Number(numberOfPlayers[0]) : 0;
            // console.log("playersCount", playersCount);
            const times = extraTimes.filter((teeTime) => {
              return (
                teeTime.time >= allowedTimeToSell.fromTime &&
                teeTime.time <= allowedTimeToSell.toTime &&
                (teeTime.firstPartySlots >= playersCount ||
                  (isSellingLeftoverSinglePlayer && teeTime.firstPartySlots === 1))
              );
            });
            newTeeTimeData = [...newTeeTimeData, ...times.slice(0, limit - newTeeTimeData.length)];
            // console.log("times", times, innerCursor, limit);
          }
          if (newTeeTimeData.length !== limit) {
            innerCursor += 1;
          } else {
            break;
          }
        } else {
          for (const allowedTimeToSell of courseAllowedTeeTimeToSellFilters) {
            const binaryMask = allowedTimeToSell.primaryMarketAllowedPlayers;
            const isSellingLeftoverSinglePlayer = allowedTimeToSell.primaryMarketSellLeftoverSinglePlayer;
            // console.log("binaryMask", binaryMask);
            const numberOfPlayers =
              binaryMask !== null && binaryMask !== undefined
                ? PlayersOptions.filter((_, index) => (binaryMask & (1 << index)) !== 0)
                : PlayersOptions;
            // console.log("numberOfPlayers", numberOfPlayers);
            const playersCount = numberOfPlayers?.[0] ? Number(numberOfPlayers[0]) : 0;
            // console.log("playersCount", playersCount);
            const times = teeTimesData.filter((teeTime) => {
              return (
                teeTime.time >= allowedTimeToSell.fromTime &&
                teeTime.time <= allowedTimeToSell.toTime &&
                (teeTime.firstPartySlots >= playersCount ||
                  (isSellingLeftoverSinglePlayer && teeTime.firstPartySlots === 1))
              );
            });
            // console.log("times", times, innerCursor, limit);
            newTeeTimeData = [...newTeeTimeData, ...times.slice(0, limit - newTeeTimeData.length)];
          }
          if (newTeeTimeData.length !== limit) {
            needToRepeat = true;
          }
        }
        // console.log("newTeeTimeData", newTeeTimeData.length);
      }
      teeTimesData = newTeeTimeData;
    }

    const priceAccordingToDate: any[] = await this.getTeeTimesPriceWithRange(
      courseId,
      courseDataIfAvailable?.timeZoneCorrection ?? 0
    );
    const filteredDate: any[] = [];
    console.log("date is", date);

    priceAccordingToDate.forEach((el) => {
      if (
        ((dayjs(el.toDayFormatted).isAfter(date) && dayjs(el.fromDayFormatted).isBefore(date)) ||
          dayjs(date).isSame(dayjs(el.fromDayFormatted))) &&
        !filteredDate.length
      ) {
        filteredDate.push(el);
        return;
      } else {
      }
    });

    const advancedBookingFeeAccordingToDate: any[] = await this.getTeeTimesAdvancedFeeWithRange(
      courseId,
      courseDataIfAvailable?.timeZoneCorrection ?? 0
    );
    const filteredAdvancedFees: any[] = [];

    advancedBookingFeeAccordingToDate.forEach((el) => {
      if (
        ((dayjs(el.toDayFormatted).isAfter(date) && dayjs(el.fromDayFormatted).isBefore(date)) ||
          dayjs(date).isSame(dayjs(el.fromDayFormatted))) &&
        !filteredAdvancedFees.length
      ) {
        filteredAdvancedFees.push(el);
        return;
      }
    });
    const markupFeesFinal = filteredDate.length
      ? filteredDate[0].markUpFees
      : courseDataIfAvailable.markupFees;
    const markupFeesToBeUsed = markupFeesFinal / 100;
    const advancedBookingFeesPerPlayer = filteredAdvancedFees.length
      ? filteredAdvancedFees[0].advancedBookingFeePerPlayer
      : 0;
    const advancedBookingFeesPerPlayerDecimal = advancedBookingFeesPerPlayer / 100;
    const firstHandResults = teeTimesData.map((teeTime) => {
      return {
        ...teeTime,
        soldById: teeTime.courseId,
        soldByName: teeTime.courseName ? teeTime.courseName : "Golf District",
        soldByImage: teeTime.logo
          ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${teeTime.logo.key}.${teeTime.logo.extension}`
          : "/defaults/default-profile.webp",
        date: teeTime.providerDate,
        teeTimeId: teeTime.id,
        time: teeTime.time,
        //TODO: use isCartIncluded instead
        // includesCart: teeTime.cartFee >= 1,
        userWatchListed: teeTime.favoritesId ? true : false,
        availableSlots: teeTime.firstPartySlots,
        firstOrSecondHandTeeTime: TeeTimeType.FIRST_HAND,
        isListed: false,
        minimumOfferPrice: teeTime.greenFee / 100, //add more fees?
        pricePerGolfer:
          teeTime.greenFee / 100 +
          teeTime.cartFee / 100 +
          markupFeesToBeUsed +
          advancedBookingFeesPerPlayerDecimal, //add more fees?
        isOwned: false,
        firstHandPurchasePrice: 0,
        bookingIds: [],
        listingId: undefined,
        greenFee: teeTime.greenFee + advancedBookingFeesPerPlayer,
        advancedBookingFeesPerPlayer: advancedBookingFeesPerPlayer ?? 0,
      };
    });

    const secondHandBookingsQuery = this.database
      .select({
        id: bookings.id,
        ownerId: bookings.ownerId,
        teeTimeId: bookings.teeTimeId,
        numberOfHoles: bookings.numberOfHoles,
        includesCart: bookings.includesCart,
        isListed: bookings.isListed,
        listingId: lists.id,
        ownerName: users.handle,
        favorites: favorites.id,
        listedSlots: lists.slots,
        listPrice: lists.listPrice,
        minimumOfferPrice: bookings.minimumOfferPrice,
        date: teeTimes.providerDate,
        time: teeTimes.time,
        greenFee: teeTimes.greenFeePerPlayer,
        profilePicture: {
          key: assets.key,
          extension: assets.extension,
        },
        groupId: bookings.groupId,
        allowSplit: lists.allowSplit,
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.ownerId))
      .leftJoin(assets, eq(assets.id, users.image))
      .leftJoin(lists, eq(lists.id, bookings.listId))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, bookings.teeTimeId), eq(favorites.userId, userId)))
      .where(
        and(
          and(gte(teeTimes.time, startTime), lte(teeTimes.time, endTime)),
          // between(lists.listPrice, lowerPrice, upperPrice),
          gte(teeTimes.providerDate, currentTimePlus30Min),
          between(teeTimes.providerDate, startOfDay, endOfDay),
          eq(teeTimes.courseId, courseId),
          eq(bookings.includesCart, includesCart),
          eq(teeTimes.numberOfHoles, holes),
          eq(bookings.isListed, true),
          gte(teeTimes.greenFeePerPlayer, 0)
        )
      )
      .orderBy(
        sortPrice === "desc"
          ? desc(lists.listPrice)
          : sortTime === "desc"
            ? desc(teeTimes.time)
            : sortPrice === "asc"
              ? asc(lists.listPrice)
              : asc(teeTimes.time)
      );
    // .limit(limit);
    const secoondHandData = await secondHandBookingsQuery.execute().catch(async (err) => {
      await loggerService.errorLog({
        userId: _userId ?? "",
        url: `/${courseId}`,
        userAgent: "",
        message: "ERROR_GETTING_SECOND_HAND_TEE_TIMES",
        stackTrace: `Error retrieving second hand tee times where courseId: ${courseId}, date: ${date}, minDate:${minDate}, maxDate:${maxDate}, startTime:${startTime}, endTime:${endTime}, holes:${holes}, golfers:${golfers}`,
        additionalDetailsJSON: `Error getting second hand tee times for ${date}: ${err}`,
      });
      this.logger.error(err);
      throw new Error(`Error getting second hand tee times for ${date}: ${err}`);
    });

    //group objects that have the same teeTimeId and add one
    const groupedSecondHandData = secoondHandData.reduce(
      (acc, booking, idx) => {
        const teeTimeId = booking?.teeTimeId;
        if (teeTimeId) {
          if (!acc[teeTimeId]) {
            acc[`${teeTimeId}___${idx}`] = {
              ...booking,
              soldById: booking?.ownerId,
              soldByName: booking?.ownerName ?? "Anonymous",
              soldByImage: booking?.profilePicture
                ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${booking?.profilePicture.key}.${booking?.profilePicture.extension}`
                : "/defaults/default-profile.webp",
              pricePerGolfer:
                booking.listingId && booking.listPrice
                  ? Number((booking.listPrice * (1 + buyerFee)) / 100)
                  : ((booking?.greenFee ?? 0) * 13) / 10,
              includesCart: booking?.includesCart,
              firstOrSecondHandTeeTime: booking.isListed ? TeeTimeType.SECOND_HAND : TeeTimeType.UNLISTED,
              userWatchListed: booking.favorites ? true : false,
              firstHandPurchasePrice: booking?.greenFee ?? 0,
              bookingIds: [booking?.id],
              availableSlots: 1,
              date: booking?.date ?? "",
              time: booking?.time ?? 2400,
              minimumOfferPrice: booking.listingId ? booking?.minimumOfferPrice : 0,
              listingId: booking.listingId ?? undefined,
              listedSlots: booking.listedSlots,
              isOwned: true,
              groupId: booking?.groupId ?? "",
              allowSplit: booking?.allowSplit ?? false,
            };
          } else {
            // @ts-expect-error
            acc[teeTimeId].availableSlots++;
            acc[teeTimeId]?.bookingIds?.push(booking?.id);
          }
        }
        return acc;
      },

      {} as Record<string, CombinedObject>
    );
    const secondHandResults = Object.values(groupedSecondHandData).filter((i) =>
      golfers === -1 && i.listedSlots !== null ? i.listedSlots >= 1 : i.listedSlots == golfers
    );
    const secondHandCount = secondHandResults.length;

    //combine first and second hand results according to sort params
    const combinedResults = [...firstHandResults, ...secondHandResults];

    const combinedResultsInRange = combinedResults.filter((teeTime) => {
      const totalFee = teeTime.pricePerGolfer;
      return totalFee >= lowerPrice && totalFee <= upperPrice;
    });

    //sort combined results
    const sortedResults = combinedResultsInRange.sort((a, b) => {
      if (sortPrice === "desc") {
        return b.pricePerGolfer - a.pricePerGolfer;
      } else if (sortTime === "desc") {
        return b.time - a.time;
      } else if (sortPrice === "asc") {
        return a.pricePerGolfer - b.pricePerGolfer;
      } else {
        return a.time - b.time;
      }
    });

    const totalCount = firstHandCount + secondHandCount;
    return { results: sortedResults, cursor: cursor, count: totalCount };
  }

  /**
   * Helper function to sanitize user handles.
   * @param {string} username - The user handle to sanitize.
   * @returns {string} - The sanitized user handle.
   * @example
   * const sanitizedUsername = searchService.sanitizeHandle("user123");
   */
  sanitizeHandle = (username: string): string => {
    if (username.length <= 2) {
      return username;
    }
    return (
      username.substring(0, 2) + "*".repeat(username.length - 4) + username.substring(username.length - 2)
    );
  };

  /**
   * Helper function to sanitize email addresses.
   * @param {string} email - The email address to sanitize.
   * @returns {string} - The sanitized email address.
   * @example
   * const sanitizedEmail = searchService.sanitizeEmail("user@example.com");
   */
  sanitizeEmail = (email: string): string => {
    const [localPart = "", domain = ""] = email.split("@");

    if (!domain || !domain.includes(".")) {
      return "****";
    }

    const domainParts = domain.split(".");
    const primaryDomain = domainParts[0] ?? "";
    const topLevelDomain = domainParts[1] ?? "";
    const sanitizedLocalPart = this.sanitizeLocalPart(localPart);
    const sanitizedPrimaryDomain = this.sanitizePrimaryDomain(primaryDomain);

    return `${sanitizedLocalPart}@${sanitizedPrimaryDomain}.${topLevelDomain}`;
  };

  /**
   * Helper function to sanitize local parts of email addresses.
   * @param {string} localPart - The local part of the email address to sanitize.
   * @returns {string} - The sanitized local part.
   * @example
   * const sanitizedLocalPart = searchService.sanitizeLocalPart("user123");
   */
  sanitizeLocalPart = (localPart: string): string => {
    return localPart.length > 2 ? localPart.substring(0, 2) + "*".repeat(localPart.length - 2) : localPart;
  };

  /**
   * Helper function to sanitize primary domains of email addresses.
   * @param {string} primaryDomain - The primary domain of the email address to sanitize.
   * @returns {string} - The sanitized primary domain.
   * @example
   * const sanitizedPrimaryDomain = searchService.sanitizePrimaryDomain("example");
   */
  sanitizePrimaryDomain = (primaryDomain: string): string => {
    return primaryDomain.length > 1
      ? primaryDomain.substring(0, 1) + "*".repeat(primaryDomain.length - 1)
      : primaryDomain;
  };

  getSpecialEvents = async (courseId: string): Promise<SpecialEvent[]> => {
    const today = dayjs().startOf("day").format("YYYY-MM-DD HH:mm:ss");
    const threeMonthsFromNow = dayjs().add(3, "month").endOf("day").format("YYYY-MM-DD HH:mm:ss");

    const events = await this.database
      .select({
        id: majorEvents.id,
        eventName: majorEvents.eventName,
        startDate: majorEvents.startDate,
        endDate: majorEvents.endDate,
        eventStartDate: majorEvents.eventStartDate,
        eventEndDate: majorEvents.eventEndDate,
        logo: {
          key: assets.key,
          extension: assets.extension,
        },
      })
      .from(majorEvents)
      .leftJoin(assets, eq(assets.id, majorEvents.iconAssetId))
      .where(and(eq(majorEvents.courseId, courseId), gt(majorEvents.endDate, today)))
      .orderBy(asc(majorEvents.startDate))
      .limit(6)
      .execute()
      .catch((e) => {
        console.log("Error in getting special Events", e);
        return [];
      });

    const cdnUrl = process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL;

    const finalEvents = events
      ?.map((event) => {
        let finalStartDate = today;
        let finalEndDate = threeMonthsFromNow;

        // Case 1: Both eventStartDate and eventEndDate are empty
        if (!event.eventStartDate && !event.eventEndDate) {
          finalStartDate = dayjs(event.startDate)
            .subtract(3, "month")
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss");
          finalEndDate = dayjs(event.endDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");
        }
        // Case 2: eventStartDate is present and eventEndDate is empty
        else if (event.eventStartDate && !event.eventEndDate) {
          finalStartDate = dayjs(event.eventStartDate).startOf("day").format("YYYY-MM-DD HH:mm:ss");
          finalEndDate = dayjs(event.endDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");
        }
        // Case 3: eventStartDate is empty and eventEndDate is present
        else if (!event.eventStartDate && event.eventEndDate) {
          finalStartDate = dayjs(event.startDate)
            .subtract(3, "month")
            .startOf("day")
            .format("YYYY-MM-DD HH:mm:ss");
          finalEndDate = dayjs(event.eventEndDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");
        }
        // Case 4: Both eventStartDate and eventEndDate are present
        else if (event.eventStartDate && event.eventEndDate) {
          finalStartDate = dayjs(event.eventStartDate).startOf("day").format("YYYY-MM-DD HH:mm:ss");
          finalEndDate = dayjs(event.eventEndDate).endOf("day").format("YYYY-MM-DD HH:mm:ss");
        }

        if (dayjs(finalStartDate).isAfter(today) || dayjs(finalEndDate).isBefore(today)) {
          return;
        }

        return {
          ...event,
          eventStartDate: finalStartDate,
          eventEndDate: finalEndDate,
          logo: {
            ...event.logo,
            cdn: cdnUrl,
          },
          iconUrl: event.logo
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${event?.logo?.key}.${event?.logo?.extension}`
            : null,
        };
      })
      .filter(Boolean);

    const sortedEvents = finalEvents?.sort((a, b) => {
      const dateA = dayjs(a?.eventStartDate);
      const dateB = dayjs(b?.eventStartDate);
      return dateA.isBefore(dateB) ? -1 : dateA.isAfter(dateB) ? 1 : 0;
    });

    return sortedEvents;
  };

  getPriceForecast = async (
    courseId: string,
    startDate: string,
    endDate: string
  ): Promise<PriceForecast[]> => {
    let forecastData = await this.getCache(`${courseId}-${startDate}-${endDate}-${process.env.NODE_ENV}`)!;

    if (!forecastData) {
      const formattedStartDate = new Date(startDate).toISOString().split("T")[0];
      forecastData = await this.database
        .select({
          courseId: teeTimes.courseId,
          name: courses.name,
          providerDate: sql`DATE(${teeTimes.providerDate})`.as("providerDate"),
          EarlyMorning:
            sql`Min(If(${teeTimes.time} >= 600 And ${teeTimes.time} <= 800, ${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer}, Null))`.as(
              "EarlyMorning"
            ),
          MidMorning:
            sql`Min(If(${teeTimes.time} >= 801 And ${teeTimes.time} <= 1030, ${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer}, Null))`.as(
              "MidMorning"
            ),
          EarlyAfternoon:
            sql`Min(If(${teeTimes.time} >= 1031 AND ${teeTimes.time} <= 1400, ${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer}, Null))`.as(
              "EarlyAfternoon"
            ),
          Afternoon:
            sql`Min(If(${teeTimes.time} >= 1401 And ${teeTimes.time} <= 1600, ${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer}, Null))`.as(
              "Afternoon"
            ),
          Twilight:
            sql`Min(If(${teeTimes.time} >= 1601 And ${teeTimes.time} <= 1800, ${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} + ${courses.markupFeesFixedPerPlayer}, Null))`.as(
              "Twilight"
            ),
        })
        .from(teeTimes)
        .innerJoin(courses, eq(teeTimes.courseId, courses.id))
        .where(
          and(
            gte(sql`DATE(${teeTimes.providerDate})`, formattedStartDate),
            eq(teeTimes.courseId, courseId),
            sql`${teeTimes.greenFeePerPlayer} + ${teeTimes.cartFeePerPlayer} > 0`,
            sql`${teeTimes.availableFirstHandSpots} > 0`
          )
        )
        .groupBy(teeTimes.courseId, courses.name, sql`Date(${teeTimes.providerDate})`)
        .orderBy(asc(teeTimes.courseId), asc(courses.name), asc(sql`Date(${teeTimes.providerDate})`))
        .execute();

      await this.setCache(
        `${courseId}-${startDate}-${endDate}-${process.env.NODE_ENV}`,
        forecastData,
        60 * 60
      );
    }

    if (forecastData && Array.isArray(forecastData)) {
      const formattedData = forecastData.map((item: PriceForecast) => ({
        ...item,
        providerDate: item.providerDate,
        EarlyMorning: item.EarlyMorning ? item.EarlyMorning / 100 : null,
        MidMorning: item.MidMorning ? item.MidMorning / 100 : null,
        EarlyAfternoon: item.EarlyAfternoon ? item.EarlyAfternoon / 100 : null,
        Afternoon: item.Afternoon ? item.Afternoon / 100 : null,
        Twilight: item.Twilight ? item.Twilight / 100 : null,
      }));

      return formattedData;
    } else {
      return [];
    }
  };

  getAvailableTimesForGroupedBookings = async (
    startTime: number,
    endTime: number,
    dates: string[],
    golferCount: number,
    courseId: string,
    minimumGolferGroup = 4
  ) => {
    try {
      const MINUTES_PRIOR_TO_START_TIME = 30;
      const ADDITIONAL_DAYS_TO_SEARCH = 2;

      // const availableTimes: Record<string, any> = {};
      const availableTimes: Record<string, TeeTimeGroup[]> = {};
      const [courseInfo] = await this.database
        .select({
          fixedMarkup: courses.markupFeesFixedPerPlayer,
          timeZoneCorrection: courses.timezoneCorrection,
          courseOpenTime: courses.courseOpenTime,
          groupBookingFeePerPlayer: courses.groupBookingFeePerPlayer,
        })
        .from(courses)
        .where(eq(courses.id, courseId))
        .execute()
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/getAvailableTimesForGroupedBookings",
            userAgent: "",
            message: "ERROR_GETTING_COURSE_INFO",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          return [];
        });
      const [courseSettingResponse] = await this.database
        .select({
          value: courseSetting.value,
        })
        .from(courseSetting)
        .where(
          and(
            eq(courseSetting.courseId, courseId),
            eq(courseSetting.internalName, "GROUP_BOOKING_PRICE_SELECTION_METHOD")
          )
        )
        .execute()
        .catch((err) => {
          this.logger.error(err);
          loggerService.errorLog({
            userId: "",
            url: "/getAvailableTimesForGroupedBookings",
            userAgent: "",
            message: "ERROR_GETTING_GROUP_BOOKING_PRICE_SELECTION_METHOD",
            stackTrace: `${err.stack}`,
            additionalDetailsJSON: JSON.stringify({
              courseId,
            }),
          });
          return [];
        });

      //searchStartTime. It needs to be 30 mins priore to start time and it should be in course open time.
      const hours = Math.floor(startTime / 100);
      const minutes = startTime % 100;
      const paddedHours = hours.toString().padStart(2, "0");
      const paddedMinutes = minutes.toString().padStart(2, "0");
      const prioreStartTime = Number(
        dayjs
          .utc(`2000-01-01T${paddedHours}:${paddedMinutes}:00`, "YYYY-MM-DDTHH:mm:ss")
          .subtract(MINUTES_PRIOR_TO_START_TIME, "minute")
          .format("HHmm")
      );
      const searchStartTime = Math.max(prioreStartTime, courseInfo?.courseOpenTime ?? 0);

      for (let day = 1; day <= ADDITIONAL_DAYS_TO_SEARCH; day++) {
        const searchedDate = dates[0];
        dates.push(dayjs.utc(searchedDate, "YYYY-MM-DD").add(day, "day").format("YYYY-MM-DD"));
      }

      const priceAccordingToDate = await this.getTeeTimesPriceWithRange(
        courseId,
        courseInfo?.timeZoneCorrection ?? 0
      );
      const advancedBookingFeeAccordingToDate = await this.getTeeTimesAdvancedFeeWithRange(
        courseId,
        courseInfo?.timeZoneCorrection ?? 0
      );

      const groupBookingPriceSelectionMethod = courseSettingResponse?.value ?? "MAX";

      const slidingWindowSize = Math.ceil(golferCount / minimumGolferGroup);

      const teeTimesQuery = this.database
        .select()
        .from(teeTimes)
        .where(and(eq(teeTimes.courseId, courseId), like(teeTimes.providerDate, sql.placeholder("date"))))
        .orderBy(asc(teeTimes.providerDate))
        .prepare();

      for (const date of dates) {
        const filteredDate = [] as typeof priceAccordingToDate;
        const formattedDate = this.formatDateToAppropriateFormat(date);
        priceAccordingToDate.forEach((el) => {
          if (
            ((dayjs.utc(el.toDayFormatted).isAfter(formattedDate) &&
              dayjs.utc(el.fromDayFormatted).isBefore(formattedDate)) ||
              dayjs(formattedDate).isSame(dayjs.utc(el.fromDayFormatted), "day")) &&
            !filteredDate.length
          ) {
            filteredDate.push(el);
            return;
          }
        });
        const filteredAdvancedFees = [] as typeof advancedBookingFeeAccordingToDate;
        advancedBookingFeeAccordingToDate.forEach((el) => {
          if (
            ((dayjs.utc(el.toDayFormatted).isAfter(formattedDate) &&
              dayjs.utc(el.fromDayFormatted).isBefore(formattedDate)) ||
              dayjs(formattedDate).isSame(dayjs.utc(el.fromDayFormatted), "day")) &&
            !filteredAdvancedFees.length
          ) {
            filteredAdvancedFees.push(el);
            return;
          }
        });

        const markupFeesFinal =
          courseInfo?.groupBookingFeePerPlayer !== null
            ? courseInfo?.groupBookingFeePerPlayer
            : (filteredDate.length
              ? filteredDate[0]?.markUpFees
              : courseInfo?.fixedMarkup);
        const markupFeesToBeUsed = (markupFeesFinal ?? 0) / 100;
        const advancedBookingFeesPerPlayer = filteredAdvancedFees.length
          ? filteredAdvancedFees[0]?.advancedBookingFeePerPlayer ?? 0
          : 0;
        const advancedBookingFeesPerPlayerDecimal = advancedBookingFeesPerPlayer / 100;

        console.log("fetching tee times for date", date);
        const teeTimesResponse = await teeTimesQuery
          .execute({
            date: `${date}%`,
          })
          .catch((err) => {
            this.logger.error(err);
            void loggerService.errorLog({
              userId: "",
              url: "/getAvailableTimesForGroupedBookings",
              userAgent: "",
              message: "ERROR_GETTING_TEE_TIMES",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                courseId,
                date,
              }),
            });
            throw new Error("Error fetching tee times");
          });

        let minTimeGapBetweenTwoTeeTimes = Number.MAX_VALUE;
        for (let i = 0; i < teeTimesResponse.length - 1; i++) {
          const currentTeeTime = teeTimesResponse[i];
          const nextTeeTime = teeTimesResponse[i + 1];

          if (!currentTeeTime || !nextTeeTime) {
            continue;
          }
          const timeGap = dayjs(nextTeeTime?.providerDate).diff(
            dayjs(currentTeeTime?.providerDate),
            "minute"
          );

          if (timeGap < minTimeGapBetweenTwoTeeTimes && timeGap > 0) {
            minTimeGapBetweenTwoTeeTimes = timeGap;
          }
        }
        if (minTimeGapBetweenTwoTeeTimes < 0 || minTimeGapBetweenTwoTeeTimes === Number.MAX_VALUE) {
          continue;
        }

        const teeTimesToCheck = teeTimesResponse.filter((teeTime) => {
          return teeTime.time >= searchStartTime && teeTime.time <= endTime;
        });

        // Based on the sliding window size, check available times for each tee time
        for (let i = 0; i < teeTimesToCheck.length - slidingWindowSize; i++) {
          const window = teeTimesToCheck.slice(i, i + slidingWindowSize);
          let areSpotsAvailable = true,
            isContinuous = true;
          let remainingGolferCount = golferCount;
          const requiresPlayerRedistribution = golferCount % 4 === 1 && minimumGolferGroup === 4;
          for (const teeTime of window) {
            if (teeTime.availableFirstHandSpots >= Math.min(minimumGolferGroup, remainingGolferCount)) {
              if (requiresPlayerRedistribution && remainingGolferCount === 1 && !(teeTime.availableFirstHandSpots > 1)) {
                areSpotsAvailable = false;
                break;
              }
              remainingGolferCount -= teeTime.availableFirstHandSpots;
            } else {
              areSpotsAvailable = false;
              break;
            }
          }
          for (let i = 0; i < window.length - 1; i++) {
            const currentTeeTime = window[i];
            const nextTeeTime = window[i + 1];

            const timeGap = dayjs(nextTeeTime?.providerDate).diff(
              dayjs(currentTeeTime?.providerDate),
              "minute"
            );
            if (nextTeeTime && currentTeeTime && timeGap === minTimeGapBetweenTwoTeeTimes) {
              continue;
            } else {
              isContinuous = false;
              break;
            }
          }

          let pricePerGolfer: number;
          let remainingPlayers = golferCount;
          if (groupBookingPriceSelectionMethod === "MAX") {
            pricePerGolfer = window.reduce((acc, teeTime) => {
              return Math.max(
                acc,
                (teeTime.greenFeePerPlayer + teeTime.cartFeePerPlayer) / 100 +
                markupFeesToBeUsed +
                advancedBookingFeesPerPlayerDecimal
              );
            }, 0);
          } else if (groupBookingPriceSelectionMethod === "SUM") {
            const totalPrice = window.reduce((acc, teeTime) => {
              const players = Math.min(remainingPlayers, teeTime.availableFirstHandSpots);
              remainingPlayers -= players;
              return (
                acc +
                ((teeTime.greenFeePerPlayer + teeTime.cartFeePerPlayer) / 100 +
                  markupFeesToBeUsed +
                  advancedBookingFeesPerPlayerDecimal) *
                players
              );
            }, 0);
            pricePerGolfer = totalPrice / golferCount;
          } else {
            throw new Error("Invalid groupBookingPriceSelectionMethod");
          }

          if (areSpotsAvailable && isContinuous) {
            if (!availableTimes[date]) {
              availableTimes[date] = [];
            }

            let remainingPlayers = golferCount;
            const windowWithSlots = window.map((teeTime) => {
              let players = Math.min(remainingPlayers, teeTime.availableFirstHandSpots);

              if (requiresPlayerRedistribution && remainingPlayers === 5) {
                players = players - 1;
              }

              remainingPlayers -= players;
              return {
                ...teeTime,
                players,
              };
            })

            availableTimes[date]!.push({
              teeTimes: windowWithSlots,
              time: window[0]!.time,
              pricePerGolfer,
              teeTimeIds: window.map((teeTime) => teeTime.id),
              date: window[0]!.providerDate,
            });
          }
          if (date !== dates[0] && availableTimes[date]?.length === 4) {
            break;
          }
        }
      }

      return availableTimes;
    } catch (err) {
      this.logger.error(`${JSON.stringify(err)}`);
    }
  };

  getTeeTimesByIds = async (teeTimeIds: string[], playerCount: number, _userId?: string) => {
    let userId = "00000000-0000-0000-0000-000000000000";
    if (_userId) {
      userId = _userId;
    }

    const teeTimesData = await this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.date,
        numberOfHoles: teeTimes.numberOfHoles,
        firstPartySlots: teeTimes.availableFirstHandSpots,
        greenFee: teeTimes.greenFeePerPlayer,
        cartFee: teeTimes.cartFeePerPlayer,
        courseName: courses.name,
        markupFeesFixedPerPlayer: courses.markupFeesFixedPerPlayer,
        favorites: favorites.id,
        providerDate: teeTimes.providerDate,
        greenFeeTax: teeTimes.greenFeeTaxPerPlayer,
        cartFeeTax: teeTimes.cartFeeTaxPerPlayer,
        numberOfWatchers: sql<number>`(
          SELECT COUNT(*)
          FROM ${favorites}
          WHERE ${favorites.teeTimeId} = ${teeTimes.id}
        )`,
        logo: {
          key: assets.key,
          extension: assets.extension,
        },
        timezoneCorrection: courses.timezoneCorrection,
        greenFeeTaxPercent: courses.greenFeeTaxPercent,
        cartFeeTaxPercent: courses.cartFeeTaxPercent,
        weatherGuaranteeTaxPercent: courses.weatherGuaranteeTaxPercent,
        markupTaxPercent: courses.markupTaxPercent,
        merchandiseTaxPercent: courses.merchandiseTaxPercent,
        groupBookingFeePerPlayer: courses.groupBookingFeePerPlayer,
      })
      .from(teeTimes)
      .where(inArray(teeTimes.id, teeTimeIds))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      // .leftJoin(assets, and(eq(assets.courseId, teeTimes.courseId), eq(assets.id, courses.logoId)))
      .leftJoin(assets, eq(assets.id, courses.logoId))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, teeTimes.id), eq(favorites.userId, userId)))
      .orderBy(asc(teeTimes.providerDate))
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId,
          url: "/SearchService/getTeeTimeById",
          userAgent: "",
          message: "ERROR_GETTING_TEE_TIMES",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            teeTimeIds,
            userId,
          }),
        });
        return [];
      });
    if (!teeTimesData.length) {
      return null;
    }

    const mappedTeeTimes = await Promise.all(
      teeTimesData.map(async (tee) => {
        const priceAccordingToDate: any[] = await this.getTeeTimesPriceWithRange(
          tee?.courseId,
          tee?.timezoneCorrection
        );
        const filteredDate: any[] = [];

        const date = dayjs(tee?.providerDate).utc();
        const dateWithTimezone = date.add(tee?.timezoneCorrection).toString();
        priceAccordingToDate.forEach((el) => {
          if (
            dayjs(el.toDayFormatted).isAfter(dateWithTimezone) &&
            dayjs(el.fromDayFormatted).isBefore(dateWithTimezone) &&
            !filteredDate.length
          ) {
            filteredDate.push(el);
            return;
          }
        });
        const advancedBookingFeeAccordingToDate: any[] = await this.getTeeTimesAdvancedFeeWithRange(
          tee?.courseId,
          tee?.timezoneCorrection
        );
        const filteredAdvancedFees: any[] = [];

        advancedBookingFeeAccordingToDate.forEach((el) => {
          if (
            dayjs(el.toDayFormatted).isAfter(dateWithTimezone) &&
            dayjs(el.fromDayFormatted).isBefore(dateWithTimezone) &&
            !filteredAdvancedFees.length
          ) {
            filteredAdvancedFees.push(el);
            return;
          }
        });

        const markupFeesFinal =
          tee.groupBookingFeePerPlayer ??
          (filteredDate.length ? filteredDate[0].markUpFees : tee.markupFeesFixedPerPlayer);
        const markupFeesToBeUsed = markupFeesFinal / 100;
        const advancedBookingFeesPerPlayer = filteredAdvancedFees.length
          ? filteredAdvancedFees[0].advancedBookingFeePerPlayer
          : 0;
        const advancedBookingFeesPerPlayerDecimal = advancedBookingFeesPerPlayer / 100;
        const watchers = await this.database
          .select({
            userId: favorites.userId,
            handle: users.handle,
            image: {
              key: assets.key,
              extension: assets.extension,
            },
          })
          .from(favorites)
          .innerJoin(users, eq(users.id, favorites.userId))
          .leftJoin(assets, eq(assets.id, users.image))
          .where(eq(favorites.teeTimeId, tee.id))
          .limit(10)
          .execute()
          .catch((err) => {
            this.logger.error(err);
            loggerService.errorLog({
              userId: "",
              url: "/SearchService/getTeeTimeById",
              userAgent: "",
              message: "ERROR_GETTING_WATCHERS",
              stackTrace: `${err.stack}`,
              additionalDetailsJSON: JSON.stringify({
                teeTimeId: tee.id,
              }),
            });
            return [];
          });

        const forecast = await this.weatherService.getForecast(tee.courseId);
        const teeTimeDate = new Date(tee.date);
        const weather = this.matchForecastToTeeTime(teeTimeDate, forecast);
        const res: TeeTimeSearchObject = {
          soldById: tee.courseId,
          soldByName: tee.courseName ? tee.courseName : "Golf District",
          soldByImage: tee.logo
            ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${tee.logo.key}.${tee.logo.extension}`
            : "/defaults/default-profile.webp",
          availableSlots: tee.firstPartySlots,
          pricePerGolfer:
            tee.greenFee / 100 + tee.cartFee / 100 + markupFeesToBeUsed + advancedBookingFeesPerPlayerDecimal,
          markupFees: markupFeesToBeUsed * 100,
          greenFeeTaxPerPlayer: tee.greenFeeTax,
          cartFeeTaxPerPlayer: tee.cartFeeTax,
          greenFee: tee.greenFee + advancedBookingFeesPerPlayer,
          cartFee: tee.cartFee,
          teeTimeId: tee.id,
          userWatchListed: tee.favorites ? true : false,
          date: tee.providerDate, //day of tee time
          time: tee.time, //military time
          includesCart: true,
          firstOrSecondHandTeeTime: TeeTimeType.FIRST_HAND,
          isListed: false,
          numberOfWatchers: tee.numberOfWatchers,
          watchers: watchers.map((watcher) => {
            return {
              userId: watcher.userId,
              handle: watcher.handle ? watcher.handle : "Anonymous",
              image: watcher.image
                ? `https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${watcher.image.key}.${watcher.image.extension}`
                : "/defaults/default-profile.webp",
            };
          }),
          weather,
          greenFeeTaxPercent: tee.greenFeeTaxPercent,
          cartFeeTaxPercent: tee.cartFeeTaxPercent,
          weatherGuaranteeTaxPercent: tee.weatherGuaranteeTaxPercent,
          markupTaxPercent: tee.markupTaxPercent,
          merchandiseTaxPercent: tee.merchandiseTaxPercent ?? 0,
          advancedBookingFeesPerPlayer: advancedBookingFeesPerPlayer ?? 0,
        };
        return res;
      })
    );

    const courseId = teeTimesData[0]?.courseId ?? "";

    const [courseSettingResponse] = await this.database
      .select({
        value: courseSetting.value,
      })
      .from(courseSetting)
      .innerJoin(courses, eq(courseSetting.courseId, courses.id))
      .where(
        and(
          eq(courseSetting.courseId, courseId),
          eq(courseSetting.internalName, "GROUP_BOOKING_PRICE_SELECTION_METHOD")
        )
      )
      .execute()
      .catch((err) => {
        this.logger.error(err);
        loggerService.errorLog({
          userId: "",
          url: "/getAvailableTimesForGroupedBookings",
          userAgent: "",
          message: "ERROR_GETTING_GROUP_BOOKING_PRICE_SELECTION_METHOD",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            teeTimesData,
          }),
        });
        return [];
      });

    const groupBookingPriceSelectionMethod = courseSettingResponse?.value ?? "MAX";
    let pricePerGolfer = 0,
      cartFeesForGroup = 0,
      remainingPlayers = playerCount;
    if (groupBookingPriceSelectionMethod === "MAX") {
      for (const teeTime of mappedTeeTimes) {
        pricePerGolfer = Math.max(pricePerGolfer, teeTime.pricePerGolfer);
        cartFeesForGroup = Math.max(cartFeesForGroup, teeTime.cartFee);
      }
    } else if (groupBookingPriceSelectionMethod === "SUM") {
      let totalGreenFees = 0,
        totalCartFees = 0;
      for (const teeTime of mappedTeeTimes) {
        const players = Math.min(remainingPlayers, teeTime.availableSlots);
        remainingPlayers -= players;
        totalGreenFees += teeTime.pricePerGolfer * players;
        totalCartFees += teeTime.cartFee * players;
      }
      pricePerGolfer = totalGreenFees / playerCount;
      cartFeesForGroup = totalCartFees / playerCount;
    } else {
      throw new Error("Invalid groupBookingPriceSelectionMethod");
    }

    const teeTimesResponse = mappedTeeTimes.map((teeTime) => {
      return {
        ...teeTime,
        pricePerGolferForGroup: pricePerGolfer.toFixed(2) ?? 0,
        cartFeesForGroup: cartFeesForGroup ?? 0,
      };
    });
    return teeTimesResponse;
  };
}

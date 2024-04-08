import { and, asc, between, desc, eq, gt, gte, like, lte, or, sql, type Db } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import { courses } from "@golf-district/database/schema/courses";
import { favorites } from "@golf-district/database/schema/favorites";
import { lists } from "@golf-district/database/schema/lists";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { users } from "@golf-district/database/schema/users";
import type { CombinedObject, SearchObject } from "@golf-district/shared";
import { addDays, BUYER_FEE_PERCENTAGE, TeeTimeType, type IconCodeType } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";
import { isSameDay, parseISO } from "date-fns";
import dayjs from "dayjs";
import UTC from "dayjs/plugin/utc";
import { type ProviderService } from "../tee-sheet-provider/providers.service";
import type { Forecast } from "../weather/types";
import type { WeatherService } from "../weather/weather.service";

dayjs.extend(UTC);

interface TeeTimeSearchObject {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  greenFeeTax: number;
  cartFeeTax: number;
  teeTimeId: string;
  date: string; //day of tee time
  time: number; //military time
  includesCart: boolean;
  firstOrSecondHandTeeTime: TeeTimeType;
  isListed: boolean; //false if the booking is unlisted
  userWatchListed: boolean;
  numberOfWatchers: number;
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
}

type Day = {
  year: number;
  month: number;
  day: number;
};
type TeeTimeRow = {
  teeDate: string;
};

/**
 * Service for searching users and retrieving tee time listings.
 */
export class SearchService {
  private readonly logger = Logger(SearchService.name);

  /**
   * Constructs a new SearchService.
   * @param {Db} database - The database instance for queries.
   * @param {WeatherService} weatherService - The weather service instance.
   * @param {ProviderService} providerService - The provider service instance.
   */
  constructor(
    private readonly database: Db,
    private readonly weatherService: WeatherService,
    private readonly providerService: ProviderService
  ) {}

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
        firstHandPrice: teeTimes.greenFee,
        minimumOfferPrice: bookings.minimumOfferPrice,
        purchasedFor: bookings.purchasedPrice,
        golfers: bookings.nameOnBooking,
        profilePicture: {
          key: assets.key,
          cdnUrl: assets.cdn,
          extension: assets.extension,
        },
      })
      .from(bookings)
      .leftJoin(users, eq(users.id, bookings.ownerId))
      .leftJoin(assets, eq(assets.id, users.image))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, bookings.teeTimeId), eq(favorites.userId, userId)))
      .leftJoin(teeTimes, eq(teeTimes.id, bookings.teeTimeId))
      .leftJoin(courses, eq(courses.id, teeTimes.courseId))
      .where(
        and(eq(bookings.ownerId, ownerId), eq(bookings.teeTimeId, teeTimeId), eq(bookings.isListed, false))
      )
      .execute();
    const firstBooking = unlistedBookingData[0];
    if (!unlistedBookingData || !firstBooking?.courseId || !firstBooking.date) {
      return null;
    }
    const forecast = await this.weatherService.getForecast(firstBooking.courseId).catch((err) => {
      this.logger.error("error getting forecast", err);
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
        ? `https://${firstBooking.profilePicture.cdnUrl}/${firstBooking.profilePicture.key}.${firstBooking.profilePicture.extension}`
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
        firstHandPrice: teeTimes.greenFee,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
        image: {
          key: assets.key,
          cdnUrl: assets.cdn,
          extension: assets.extension,
        },
        minimumOfferPrice: bookings.minimumOfferPrice,
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
        ? `https://${firstBooking.image.cdnUrl}/${firstBooking.image.key}.${firstBooking.image.extension}`
        : "/defaults/default-profile.webp",
      availableSlots: firstBooking.listedSlots,
      pricePerGolfer: Number((firstBooking.listPrice * (1 + firstBooking.buyerFee / 100)).toFixed(2)),
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
    const [tee] = await this.database
      .select({
        id: teeTimes.id,
        courseId: teeTimes.courseId,
        time: teeTimes.time,
        date: teeTimes.date,
        numberOfHoles: teeTimes.numberOfHoles,
        firstPartySlots: teeTimes.availableFirstHandSpots,
        greenFee: teeTimes.greenFee,
        courseName: courses.name,
        markup: courses.markup,
        favorites: favorites.id,
        providerDate: teeTimes.providerDate,
        greenFeeTax: teeTimes.greenFeeTax,
        cartFeeTax: teeTimes.cartFeeTax,
        numberOfWatchers: sql<number>`(
          SELECT COUNT(*)
          FROM ${favorites}
          WHERE ${favorites.teeTimeId} = ${teeTimes.id}
        )`,
        logo: {
          key: assets.key,
          cdnUrl: assets.cdn,
          extension: assets.extension,
        },
      })
      .from(teeTimes)
      .where(eq(teeTimes.id, teeTimeId))
      .innerJoin(courses, eq(courses.id, teeTimes.courseId))
      .leftJoin(assets, and(eq(assets.courseId, teeTimes.courseId), eq(assets.id, courses.logoId)))
      .leftJoin(favorites, and(eq(favorites.teeTimeId, teeTimes.id), eq(favorites.userId, userId)))
      .limit(1)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        return [];
      });
    if (!tee) {
      return null;
    }

    const watchers = await this.database
      .select({
        userId: favorites.userId,
        handle: users.handle,
        image: {
          key: assets.key,
          cdnUrl: assets.cdn,
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
        return [];
      });

    const forecast = await this.weatherService.getForecast(tee.courseId);
    const teeTimeDate = new Date(tee.date);
    const weather = this.matchForecastToTeeTime(teeTimeDate, forecast);
    const res: TeeTimeSearchObject = {
      soldById: tee.courseId,
      soldByName: tee.courseName ? tee.courseName : "Golf District",
      soldByImage: tee.logo
        ? `https://${tee.logo.cdnUrl}/${tee.logo.key}.${tee.logo.extension}`
        : "/defaults/default-profile.webp",
      availableSlots: tee.firstPartySlots,
      pricePerGolfer: (tee.greenFee/100) + (tee.markup ? tee.markup / 100 : 0),
      greenFeeTax: tee.greenFeeTax,
      cartFeeTax: tee.cartFeeTax,
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
            ? `https://${watcher.image.cdnUrl}/${watcher.image.key}.${watcher.image.extension}`
            : "/defaults/default-profile.webp",
        };
      }),
      weather,
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
        return [];
      });

    return teeTimeDate?.[0]?.date ?? "";
  }

  async getTeeTimesForDay(
    courseId: string,
    date: string,
    minDate: string,
    maxDate: string,
    startTime: number,
    endTime: number,
    holes: 9 | 18,
    golfers: 1 | 2 | 3 | 4,
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

    const startDate = dayjs(date).utc().hour(0).minute(0).second(0).millisecond(0).toISOString();
    const endDate = dayjs(date).utc().hour(23).minute(59).second(59).millisecond(999).toISOString();

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
        greenFee: teeTimes.greenFee,
        courseName: courses.name,
        cartFee: teeTimes.cartFee,
      })
      .from(teeTimes)
      .innerJoin(courses, eq(courses.id, courseId))
      .where(
        and(
          and(gte(teeTimes.time, startTime), lte(teeTimes.time, endTime)),
          between(teeTimes.greenFee, lowerPrice, upperPrice),
          gte(teeTimes.providerDate, currentTimePlus30Min),
          between(teeTimes.providerDate, minDateSubquery, maxDateSubquery),
          eq(teeTimes.courseId, courseId),
          includesCart ? gte(teeTimes.cartFee, 1) : eq(teeTimes.cartFee, 0), //currently do not have a hasCart column in tee time table
          eq(teeTimes.numberOfHoles, holes),
          eq(teeTimes.numberOfHoles, holes),
          gt(teeTimes.availableFirstHandSpots, 0),
          or(gte(teeTimes.availableFirstHandSpots, golfers), gte(teeTimes.availableSecondHandSpots, golfers))
        )
      );

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
        greenFee: teeTimes.greenFee,
        courseName: courses.name,
        markup: courses.markup,
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
        cartFee: teeTimes.cartFee,
        logo: {
          key: assets.key,
          cdnUrl: assets.cdn,
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
          between(teeTimes.greenFee, lowerPrice, upperPrice),
          gte(teeTimes.providerDate, currentTimePlus30Min),
          between(teeTimes.providerDate, startDate, endDate),
          eq(teeTimes.courseId, courseId),
          includesCart ? gte(teeTimes.cartFee, 1) : eq(teeTimes.cartFee, 0), //currently do not have a hasCart column in tee time table
          eq(teeTimes.numberOfHoles, holes),
          gt(teeTimes.availableFirstHandSpots, 0),
          or(gte(teeTimes.availableFirstHandSpots, golfers), gte(teeTimes.availableSecondHandSpots, golfers))
        )
      )
      .orderBy(
        sortPrice === "desc"
          ? desc(teeTimes.greenFee)
          : sortTime === "desc"
          ? desc(teeTimes.time)
          : sortPrice === "asc"
          ? asc(teeTimes.greenFee)
          : asc(teeTimes.time)
      )
      .limit(limit);
    const courseData = await this.database
      .select({
        buyerFee: courses.buyerFee,
        sellerFee: courses.sellerFee,
      })
      .from(courses)
      .where(eq(courses.id, courseId))
      .execute()
      .catch(() => {});
    let buyerFee = 0;
    if (courseData?.length) {
      buyerFee = (courseData[0]?.buyerFee ?? 1) / 100;
    }

    const teeTimesData = await teeQuery.execute().catch((err) => {
      this.logger.error(err);
      throw new Error(`Error getting tee times for ${date}: ${err}`);
    });
    const firstHandResults = teeTimesData.map((teeTime) => {
      return {
        ...teeTime,
        soldById: teeTime.courseId,
        soldByName: teeTime.courseName ? teeTime.courseName : "Golf District",
        soldByImage: teeTime.logo
          ? `https://${teeTime.logo.cdnUrl}/${teeTime.logo.key}.${teeTime.logo.extension}`
          : "/defaults/default-profile.webp",
        date: teeTime.providerDate,
        teeTimeId: teeTime.id,
        time: teeTime.time,
        includesCart: teeTime.cartFee >= 1,
        userWatchListed: teeTime.favoritesId ? true : false,
        availableSlots: teeTime.firstPartySlots,
        firstOrSecondHandTeeTime: TeeTimeType.FIRST_HAND,
        isListed: false,
        minimumOfferPrice:(teeTime.greenFee/100), //add more fees?
        pricePerGolfer: (teeTime.greenFee/100) + (teeTime.markup ? teeTime.markup / 100 : 0), //add more fees?
        isOwned: false,
        firstHandPurchasePrice: 0,
        bookingIds: [],
        listingId: undefined,
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

        greenFee: teeTimes.greenFee,
        profilePicture: {
          key: assets.key,
          cdnUrl: assets.cdn,
          extension: assets.extension,
        },
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
          or(
            between(lists.listPrice, lowerPrice, upperPrice),
            between(bookings.purchasedPrice, lowerPrice, upperPrice)
          ),
          gte(teeTimes.providerDate, currentTimePlus30Min),
          between(teeTimes.providerDate, startDate, endDate),
          eq(teeTimes.courseId, courseId),
          eq(bookings.includesCart, includesCart),
          eq(teeTimes.numberOfHoles, holes),
          showUnlisted
            ? or(eq(bookings.isListed, false), eq(bookings.isListed, true))
            : eq(bookings.isListed, true)
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
    const secoondHandData = await secondHandBookingsQuery.execute().catch((err) => {
      this.logger.error(err);
      throw new Error(`Error getting second hand tee times for ${date}: ${err}`);
    });

    //group objects that have the same teeTimeId and add one
    const groupedSecondHandData = secoondHandData.reduce(
      (acc, booking) => {
        const teeTimeId = booking?.teeTimeId;
        if (teeTimeId) {
          if (!acc[teeTimeId]) {
            acc[teeTimeId] = {
              ...booking,
              soldById: booking?.ownerId,
              soldByName: booking?.ownerName ?? "Anonymous",
              soldByImage: booking?.profilePicture
                ? `https://${booking?.profilePicture.cdnUrl}/${booking?.profilePicture.key}.${booking?.profilePicture.extension}`
                : "/defaults/default-profile.webp",
              pricePerGolfer:
                booking.listingId && booking.listPrice
                  ? Number((booking.listPrice * (1 + buyerFee)).toFixed(2))
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

    const secondHandResults = Object.values(groupedSecondHandData).filter((i) => i.availableSlots >= golfers);
    const secondHandCount = secondHandResults.length;

    //combine first and second hand results according to sort params
    const combinedResults = [...firstHandResults, ...secondHandResults];

    //sort combined results
    const sortedResults = combinedResults.sort((a, b) => {
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

    return { results: sortedResults, cursor, count: totalCount };
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
}

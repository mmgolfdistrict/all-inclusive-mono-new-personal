import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { and, asc, eq, gte, inArray, or } from "@golf-district/database";
import { assets } from "@golf-district/database/schema/assets";
import { bookings } from "@golf-district/database/schema/bookings";
import { courses } from "@golf-district/database/schema/courses";
import type { InsertFavorite } from "@golf-district/database/schema/favorites";
import { favorites } from "@golf-district/database/schema/favorites";
import { lists } from "@golf-district/database/schema/lists";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { users } from "@golf-district/database/schema/users";
import { currentUtcTimestamp } from "@golf-district/shared";
import Logger from "@golf-district/shared/src/logger";

interface WatchlistItem {
  watchListId: string;
  watchListCreatedAt: string;
  ownedBy: string;
  teeTimeId: string;
  courseId: string;
  teeTimeExpiration: string;
  price: number;
  availableSpots: number;
  image: string;
  type: "FIRST_PARTY" | "SECOND_HAND";
  status: "LISTED" | "UNLISTED";
  bookingIds: string[];
  ownedById: string;
  listId?: string;
  minimumOfferPrice: number;
}

/**
 * Service class for managing user watchlists.
 */
export class WatchlistService {
  private readonly logger = Logger(WatchlistService.name);

  /**
   * Creates an instance of WatchlistService.
   *
   * @param {Db} database - The database instance.
   */
  constructor(protected readonly database: Db) {}

  /**
   * Toggles a tee time in the user's watchlist.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} teeTimeId - The unique identifier of the tee time.
   * @returns {Promise<void>} A promise that resolves once the tee time is toggled in the watchlist.
   * @throws {Error} Throws an error if there is an issue toggling the tee time.
   * @example
   * const userId = "exampleUserId";
   * const teeTimeId = "exampleTeeTimeId";
   * await toggleTeeTimeInWatchlist(userId, teeTimeId);
   */
  toggleTeeTimeInWatchlist = async (userId: string, teeTimeId: string) => {
    // Check if the tee time is already in the watchlist
    const existingEntry = await this.database
      .select({
        id: favorites.id,
      })
      .from(favorites)
      .where(and(eq(favorites.teeTimeId, teeTimeId), eq(favorites.userId, userId)))
      .limit(1)
      .execute();

    if (existingEntry.length > 0) {
      this.logger.debug(`Removing tee time ${teeTimeId} from watchlist`);
      await this.database
        .delete(favorites)
        .where(and(eq(favorites.teeTimeId, teeTimeId), eq(favorites.userId, userId)))
        .execute();
      this.logger.debug(`Removed tee time ${teeTimeId} from watchlist`);
    } else {
      this.logger.debug(`Adding tee time ${teeTimeId} to watchlist`);
      const [teeTime] = await this.database
        .select({
          course: teeTimes.courseId,
          // entityId: teeTimes.entityId,
          entityId: courses.entityId,
        })
        .from(teeTimes)
        .leftJoin(courses, eq(courses.id, teeTimes.courseId))
        .where(eq(teeTimes.id, teeTimeId))
        .limit(1)
        .execute();

      if (!teeTime) {
        this.logger.warn(`Tee time with id ${teeTimeId} not found`);
        throw new Error(`Tee time with id ${teeTimeId} not found`);
      }

      const fav: InsertFavorite = {
        id: randomUUID(),
        userId,
        teeTimeId,
        courseId: teeTime.course,
        entityId: teeTime.entityId ?? "",
      };

      await this.database
        .insert(favorites)
        .values(fav)
        .execute()
        .catch((err) => {
          this.logger.error(err);
          throw new Error("Error adding tee time to watchlist");
        });
      this.logger.debug(`Added tee time ${teeTimeId} to watchlist`);
    }
  };

  //@TODO pagination
  /**
   * Retrieves the user's watchlist.
   *
   * @param {string} userId - The unique identifier of the user.
   * @param {string} courseId - The unique identifier of the course.
   * @param {number} [limit=10] - The maximum number of items to retrieve.
   * @param {string} [cursor] - Optional cursor for pagination.
   * @returns {Promise<{ items: WatchlistItem[]; nextCursor: string | null }>} A promise that resolves to an array of watchlist items and the next cursor for pagination.
   * @throws {Error} Throws an error if there is an issue retrieving the watchlist.
   * @example
   * const userId = "exampleUserId";
   * const courseId = "exampleCourseId";
   * const limit = 10;
   * const cursor = "exampleCursor";
   * const result = await getWatchlist(userId, courseId, limit, cursor);
   * // result: { items: [...], nextCursor: "exampleNextCursor" }
   */
  getWatchlist = async (userId: string, courseId: string, limit = 10, cursor?: string) => {
    this.logger.debug(`Retrieving watchlist for user ${userId}`);
    const watchlistItems = await this.database
      .select({
        id: favorites.id,
        teeTimeId: favorites.teeTimeId,
        courseId: favorites.courseId,
        createdAt: favorites.createdAt,
        userId: favorites.userId,
        price: teeTimes.greenFeePerPlayer,
        teeTimeExpiration: teeTimes.providerDate,
        availableFirstHandSpots: teeTimes.availableFirstHandSpots,
        availableSecondHandSpots: teeTimes.availableSecondHandSpots,
        courseName: courses.name,
        image: {
          key: assets.key,
          cdn: assets.cdn,
          extension: assets.extension,
        },
      })
      .from(favorites)
      .innerJoin(teeTimes, eq(favorites.teeTimeId, teeTimes.id))
      .innerJoin(courses, eq(favorites.courseId, courses.id))
      .innerJoin(assets, eq(assets.id, courses.logoId))
      .where(
        and(
          eq(favorites.userId, userId),
          gte(teeTimes.date, currentUtcTimestamp()),
          or(gte(teeTimes.availableFirstHandSpots, 0), gte(teeTimes.availableSecondHandSpots, 0))
        )
      )
      .orderBy(asc(favorites.createdAt))
      //.limit(limit)
      .execute()
      .catch((err) => {
        this.logger.error(err);
        throw new Error("Error retrieving watchlist");
      });
    if (watchlistItems.length === 0 || !watchlistItems || watchlistItems === undefined) {
      return {
        items: [],
        nextCursor: null,
      };
    }
    let res: WatchlistItem[] = [];
    watchlistItems.forEach((item) => {
      if (item.availableFirstHandSpots > 0) {
        res.push({
          watchListId: item.id,
          watchListCreatedAt: item.createdAt,
          teeTimeId: item.teeTimeId,
          courseId: item.courseId,
          teeTimeExpiration: item.teeTimeExpiration,
          price: item.price,
          availableSpots: item.availableFirstHandSpots,
          ownedBy: item.courseName,
          type: "FIRST_PARTY",
          status: "LISTED",
          ownedById: courseId,
          minimumOfferPrice: item.price,
          image: item.image
            ? `https://${item.image.cdn}/${item.image.key}.${item.image.extension}`
            : "/defaults/default-course.webp",
          bookingIds: [],
        });
      }
    });

    // watch list items that have available second hand spots
    const teeTimesWithAvailableSecondHandSpots = watchlistItems.filter((item) =>
      item.availableSecondHandSpots ? item.availableFirstHandSpots : 0 > 0
    );
    let booking: any[] = [];
    if (teeTimesWithAvailableSecondHandSpots.length > 0) {
      //find all second hand bookings for these tee times
      booking = await this.database
        .select({
          teeTimeId: teeTimes.id,
          watchListId: favorites.id,
          createdAt: favorites.createdAt,
          teeTimeDate: teeTimes.date,
          soldBy: bookings.ownerId,
          bookingId: bookings.id,
          soldByHandle: users.handle,
          soldById: users.id,
          price: bookings.totalAmount,
          minimumOfferPrice: bookings.minimumOfferPrice,
          image: {
            key: assets.key,
            cdn: assets.cdn,
            extension: assets.extension,
          },
          listingId: lists.id,
          listingPrice: lists.listPrice,
        })
        .from(bookings)
        .leftJoin(teeTimes, eq(bookings.teeTimeId, teeTimes.id))
        .leftJoin(users, eq(bookings.ownerId, users.id))
        .leftJoin(favorites, eq(favorites.teeTimeId, teeTimes.id))
        .leftJoin(assets, eq(assets.id, users.image))
        .leftJoin(lists, eq(bookings.listId, lists.id))
        .where(
          inArray(
            bookings.teeTimeId,
            teeTimesWithAvailableSecondHandSpots.map((item) => item.teeTimeId)
          )
        );
    }

    const groupedBookings: Record<string, WatchlistItem> = {};
    if (booking.length > 0) {
      booking.forEach((item) => {
        let key = "";
        if (item.listingId) {
          //booking is part of a listing
          key = `${item.listingId}-${item.soldBy}-${item.teeTimeId}`;
        } else {
          //booking is not listed
          key = `${item.teeTimeId}-${item.soldBy}`;
        }
        if (!groupedBookings[key]) {
          groupedBookings[key] = {
            watchListId: item.watchListId ?? "0x",
            watchListCreatedAt: item.createdAt ?? "",
            teeTimeId: item.teeTimeId ?? "",
            courseId: courseId,
            teeTimeExpiration: item.teeTimeDate ?? " ",
            price: item.listingId ? item.listingPrice ?? 0 : item.price,
            availableSpots: 1,
            ownedBy: item.soldByHandle ? item.soldByHandle : "Anonymous",
            type: "SECOND_HAND",
            status: item.listingId ? "LISTED" : "UNLISTED",
            listId: item.listingId,
            bookingIds: [item.bookingId],
            ownedById: item.soldById,
            minimumOfferPrice: item.minimumOfferPrice,
            image: item.image
              ? `https://${item.image.cdn}/${item.image.key}.${item.image.extension}`
              : "/defaults/default-profile.webp",
          };
        }
        const group = groupedBookings[key]!;
        if (!group.bookingIds.includes(item.bookingId)) {
          group.bookingIds.push(item.bookingId);
          group.availableSpots += 1;
        }
      });
    }
    res = [
      ...res,
      ...Object.values(groupedBookings).map((item) => {
        return item;
      }),
    ];

    // Encode the last item's createdAt as the next cursor if there are enough items
    // const nextCursor =
    //   watchlistItems.length === limit
    //     ? Buffer.from(watchlistItems[watchlistItems.length - 1].createdAt).toString("base64")
    //     : null;

    //console.log(watchlistItems);
    console.log("res ", res);

    return {
      items: res,
      nextCursor: null,
    };
  };
}

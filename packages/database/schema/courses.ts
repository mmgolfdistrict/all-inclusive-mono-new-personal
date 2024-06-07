import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, double, index, int, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { assets } from "./assets";
import { bookings } from "./bookings";
import { courseAssets } from "./courseAssets";
import { coursePromoCodeLink } from "./coursePromoCodeLink";
import { entities } from "./entities";
import { favorites } from "./favorites";
import { lists } from "./lists";
import { providers } from "./providers";
import { teeTimes } from "./teeTimes";
import { transfers } from "./transfers";
import { waitlistNotifications } from "./waitlistNotifications";

export const courses = mySqlTable(
  "course",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    name: varchar("name", { length: 191 }).notNull(),
    address: text("address"),
    description: text("description"),
    longitude: double("longitude"),
    latitude: double("latitude"),
    forecastApi: text("forecastApi"),
    privacyPolicy: text("privacyPolicy"),
    termsAndConditions: text("termsAndConditions"),
    convenienceFeesFixedPerPlayer: int("convenienceFeesFixedPerPlayer"),
    markupFeesFixedPerPlayer: int("markupFeesFixedPerPlayer").default(0),
    maxListPricePerGolferPercentage: int("maxListPricePerGolferPercentage").default(0),
    openTime: datetime("openTime", { mode: "string", fsp: 3 }),
    closeTime: datetime("closeTime", { mode: "string", fsp: 3 }),
    logoId: varchar("logoId", { length: 36 }),
    entityId: varchar("entityId", { length: 36 }),
    providerId: varchar("providerId", { length: 36 }),
    furthestDayToBook: int("furthestDayToBook").default(0).notNull(),
    timezoneCorrection: int("timezoneCorrection").default(0).notNull(),
    supportCharity: boolean("supportsCharity").default(false).notNull(),
    supportSensibleWeather: boolean("supportsWeatherGuarantee").default(false).notNull(),
    allowAuctions: int("supportsAuctions").default(0),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    supportsOffers: boolean("supportsOffers").default(false),
    supportsWatchlist: boolean("supportsWatchlist").default(false),
    supportsPromocode: boolean("supportsPromocode").default(false),
    buyerFee: int("buyerFee").default(1).notNull(),
    sellerFee: int("sellerFee").default(1).notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    websiteURL: varchar("websiteURL", { length: 255 }).default("https://www.golfdistrict.com/").notNull(),
  },
  (table) => {
    return {
      entityIdIdx: index("Course_entityId_idx").on(table.entityId),
      providerIdIdx: index("Course_providerId_idx").on(table.providerId),
      courseIdIsDeletedIdx: index("Course_courseId_isDeleted_idx").on(table.id, table.isDeleted),
    };
  }
);

export const coursesRelations = relations(courses, ({ one, many }) => ({
  coursesAsset: many(courseAssets),
  teeTime: many(teeTimes),
  list: many(lists),
  transfer: many(transfers),
  favorite: many(favorites),
  booking: many(bookings),
  coursePromoCodeLink: many(coursePromoCodeLink),
  entity: one(entities, {
    fields: [courses.entityId],
    references: [entities.id],
  }),
  provider: one(providers, {
    fields: [courses.providerId],
    references: [providers.id],
  }),
  logoId: one(assets, {
    fields: [courses.logoId],
    references: [assets.id],
  }),
  waitlistNotifications: many(waitlistNotifications),
}));

export type SelectCourses = InferSelectModel<typeof courses>;
export type InsertCourses = InferInsertModel<typeof courses>;

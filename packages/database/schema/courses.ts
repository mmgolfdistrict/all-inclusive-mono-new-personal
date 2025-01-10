import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, double, index, int, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { adminUsers } from "./adminUsers";
import { assets } from "./assets";
import { courseAssets } from "./courseAssets";
import { coursePromoCodeLink } from "./coursePromoCodeLink";
import { entities } from "./entities";
import { favorites } from "./favorites";
import { providers } from "./providers";
import { teeTimes } from "./teeTimes";
import { transfers } from "./transfers";
import { userWaitlists } from "./userWaitlists";

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
    privacyPolicy: text("privacyPolicyURL"),
    termsAndConditions: text("termsAndConditionsURL"),
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
    allowAuctions: boolean("supportsAuctions").default(false).notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    supportsOffers: boolean("supportsOffers").default(false).notNull(),
    supportsWatchlist: boolean("supportsWatchlist").default(false).notNull(),
    supportsPromocode: boolean("supportsPromocode").default(false).notNull(),
    supportsWaitlist: boolean("supportsWaitlist").default(true).notNull(),
    buyerFee: int("buyerFee").default(1).notNull(),
    sellerFee: int("sellerFee").default(1).notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    websiteURL: varchar("websiteURL", { length: 255 }).default("https://www.golfdistrict.com/").notNull(),
    roundUpCharityId: varchar("roundUpCharityId", { length: 191 }),
    maxRoundsPerPeriod: tinyint("maxRoundsPerPeriod"),
    maxBookingsPerPeriod: tinyint("maxBookingsPerPeriod"),
    primaryMarketAllowedPlayers: tinyint("primaryMarketAllowedPlayers"),
    timezoneISO: varchar("timezoneISO", { length: 191 }).notNull().default("America/Los_Angeles"),
    isAutomaticPayment: boolean("isAutomaticPayment").default(false).notNull(),
    paymentProcessorPercentage: double("paymentProcessorPercentage").default(3).notNull(),
    paymentInstrumentId: varchar("paymentInstrumentId", { length: 36 }).default("N/A").notNull(),
    isBookingDisabled: tinyint("isBookingDisabled").default(0).notNull(),
    authenticationMethods: int("authenticationMethods"),
    greenFeeTaxPercent: int("greenFeeTaxPercent").default(0).notNull(),
    cartFeeTaxPercent: int("cartFeeTaxPercent").default(0).notNull(),
    weatherGuaranteeTaxPercent: int("weatherGuaranteeTaxPercent").default(0).notNull(),
    markupTaxPercent: int("markupTaxPercent").default(0).notNull(),
    displayOrder: tinyint("displayOrder").notNull().default(-1),
    showPricingBreakdown: tinyint("showPricingBreakdown").default(0).notNull(),
    supportsProviderMembership:tinyint("supportsProviderMembership").default(0).notNull()
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
  transfer: many(transfers),
  favorite: many(favorites),
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
  userWaitlists: many(userWaitlists),
  adminUsers: many(adminUsers),
}));

export type SelectCourses = InferSelectModel<typeof courses>;
export type InsertCourses = InferInsertModel<typeof courses>;

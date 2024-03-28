import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  boolean,
  datetime,
  double,
  index,
  int,
  primaryKey,
  text,
  tinyint,
  varchar,
} from "drizzle-orm/mysql-core";
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
    convenanceFees: int("convenanceFees"),
    markup: int("markup").default(0),
    openTime: datetime("openTime", { mode: "string", fsp: 3 }),
    closeTime: datetime("closeTime", { mode: "string", fsp: 3 }),
    logoId: varchar("logoId", { length: 36 }),
    entityId: varchar("entityId", { length: 36 }),
    providerId: varchar("providerId", { length: 36 }),
    furthestDayToBook: int("furthestDayToBook").default(0).notNull(),
    timezoneCorrection: int("timezoneCorrection").default(0).notNull(),
    supportCharity: boolean("supportCharity").default(false).notNull(),
    supportSensibleWeather: boolean("supportSensitiveWeather").default(false).notNull(),
    allowAuctions: int("allowAuctions").default(0),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    supportsOffers: boolean("supportsOffers").default(false),
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
}));

export type SelectCourses = InferSelectModel<typeof courses>;
export type InsertCourses = InferInsertModel<typeof courses>;

import { relations, sql, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
import { datetime, index, int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { bookings } from "./bookings";
import { courses } from "./courses";
import { entities } from "./entities";
import { favorites } from "./favorites";
import { providerCourseLink } from "./providersCourseLink";

export const teeTimes = mySqlTable(
  "teeTime",
  {
    id: varchar("id", { length: 36 }).notNull().unique().primaryKey(),
    providerTeeTimeId: varchar("providerTeeTimeId", { length: 191 }).notNull().unique(), //maybe int
    date: datetime("date", { mode: "string", fsp: 3 }).notNull(),
    providerDate: varchar("providerDate", { length: 191 }).notNull(),
    time: int("time").notNull(), //military time
    numberOfHoles: int("numberOfHoles").default(18).notNull(),
    maxPlayersPerBooking: int("maxPlayersPerBooking").notNull(),
    availableFirstHandSpots: int("availableFirstHandSpots").notNull(),
    availableSecondHandSpots: int("availableSecondHandSpots").notNull(),
    greenFeePerPlayer: int("greenFeePerPlayer").notNull(),
    cartFeePerPlayer: int("cartFeePerPlayer").notNull(),
    greenFeeTaxPerPlayer: int("greenFeeTaxPerPlayer").notNull().default(0),
    cartFeeTaxPerPlayer: int("cartFeeTaxPerPlayer").notNull(),
    // courseProvider: varchar("courseProvider", { length: 191 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    // entityId: varchar("entityId", { length: 36 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdPurchasedAtNumberOfHolesIdx: index("TeeTime_courseId_purchasedAt_numberOfHoles_idx").on(
        table.courseId,
        table.numberOfHoles
      ),
      providerTeeTimeId: index("TeeTime_providerTeeTimeId_idx").on(table.providerTeeTimeId),
      greenFeePerPlayer: index("TeeTime_greenFeePerPlayer_idx").on(table.greenFeePerPlayer),
      cartFeePerPlayer: index("TeeTime_cartFee_idx").on(table.cartFeePerPlayer),
      providerDate: index("TeeTime_providerDate_idx").on(table.providerDate),
      time: index("TeeTime_time_idx").on(table.time),
      courseId: index("TeeTime_courseId_idx").on(table.courseId),
      courseDate: index("TeeTime_courseDate_idx").on(table.courseId, table.date),
    };
  }
);

export const teeTimesRelations = relations(teeTimes, ({ one, many }) => ({
  booking: many(bookings),
  favorite: many(favorites),
  course: one(courses, {
    fields: [teeTimes.courseId],
    references: [courses.id],
  }),
  // provider: one(providerCourseLink, {
  //   fields: [teeTimes.courseProvider],
  //   references: [providerCourseLink.providerId],
  // }),
  // entity: one(entities, {
  //   fields: [teeTimes.entityId],
  //   references: [entities.id],
  // }),
}));

export type SelectTeeTimes = InferSelectModel<typeof teeTimes>;
export type InsertTeeTimes = InferInsertModel<typeof teeTimes>;

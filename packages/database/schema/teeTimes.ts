import { relations, type InferInsertModel, type InferSelectModel } from "drizzle-orm";
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
    id: varchar("id", { length: 36 }).notNull().unique(),
    providerTeeTimeId: varchar("providerTeeTimeId", { length: 191 }).notNull().unique(), //maybe int
    date: datetime("date", { mode: "string", fsp: 3 }).notNull(),
    providerDate: varchar("providerDate", { length: 191 }).notNull(),
    time: int("time").notNull(), //military time
    numberOfHoles: int("numberOfHoles").default(18).notNull(),
    maxPlayersPerBooking: int("maxPlayersPerBooking").notNull(),
    availableFirstHandSpots: int("availableFirstHandSpots").notNull(),
    availableSecondHandSpots: int("availableSecondHandSpots").notNull(),
    greenFee: int("greenFee").notNull(),
    cartFee: int("cartFee").notNull(),
    greenFeeTax: int("greeFeeTax").notNull(),
    cartFeeTax: int("cartFeeTax").notNull(),
    soldByProvider: varchar("courseProvider", { length: 191 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    entityId: varchar("entityId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      courseIdPurchasedAtNumberOfHolesIdx: index("TeeTime_courseId_purchasedAt_numberOfHoles_idx").on(
        table.courseId,
        table.numberOfHoles
      ),
      providerTeeTimeId: index("TeeTime_providerTeeTimeId_idx").on(table.providerTeeTimeId),
      teeTimeId: primaryKey(table.id),
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
  provider: one(providerCourseLink, {
    fields: [teeTimes.soldByProvider],
    references: [providerCourseLink.providerId],
  }),
  entity: one(entities, {
    fields: [teeTimes.entityId],
    references: [entities.id],
  }),
}));

export type SelectTeeTimes = InferSelectModel<typeof teeTimes>;
export type InsertTeeTimes = InferInsertModel<typeof teeTimes>;

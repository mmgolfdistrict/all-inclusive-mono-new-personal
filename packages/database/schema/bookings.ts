import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, primaryKey, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { entities } from "./entities";
import { lists } from "./lists";
import { teeTimes } from "./teeTimes";
import { transfers } from "./transfers";
import { userBookingOffers } from "./userBookingOffers";
import { users } from "./users";

export const bookings = mySqlTable(
  "booking",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    purchasedAt: datetime("purchasedAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    purchasedPrice: int("purchasedFor").notNull(),
    time: datetime("redeemsAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    withCart: boolean("withCart").default(false).notNull(),
    isListed: boolean("isListed").default(false).notNull(),
    numberOfHoles: int("numberOfHoles").default(18).notNull(),
    providerBookingId: varchar("providerBookingId", { length: 191 }).notNull(),
    minimumOfferPrice: int("minimumOfferPrice").default(0).notNull(),
    ownerId: varchar("ownerId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
    nameOnBooking: varchar("nameOnBooking", { length: 191 }).default("guest").notNull(),
    includesCart: boolean("includesCart").default(false).notNull(),
    listId: varchar("listId", { length: 36 }),
    entityId: varchar("entityId", { length: 36 }),
    weatherGuaranteeId: varchar("weatherGuaranteeId", { length: 36 }),
    weatherGuaranteeAmount: int("weatherGuaranteeAmount").default(0),
  },
  (table) => {
    return {
      courseIdIdx: index("Booking_courseId_idx").on(table.courseId),
      entityIdIdx: index("Booking_entityId_idx").on(table.entityId),
      listIdIdx: index("Booking_listId_idx").on(table.listId),
      ownerIdIdx: index("Booking_userId_idx").on(table.ownerId),
      unqBookingList: unique("Booking_listId_key").on(table.listId, table.id),
    };
  }
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  transfer: many(transfers),
  courseId: one(courses, {
    fields: [bookings.courseId],
    references: [courses.id],
  }),
  list: one(lists, {
    fields: [bookings.listId],
    references: [lists.id],
  }),
  user: one(users, {
    fields: [bookings.ownerId],
    references: [users.id],
  }),
  entity: one(entities, {
    fields: [bookings.entityId],
    references: [entities.id],
  }),
  teeTime: one(teeTimes, {
    fields: [bookings.teeTimeId],
    references: [teeTimes.id],
  }),
  userBookingOffers: many(userBookingOffers),
}));

export type InsertBooking = InferInsertModel<typeof bookings>;

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, int, primaryKey, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "../schema/_table";

export const phoneBookingEntry = mySqlTable("phoneBookingEntry", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  bookingDate: varchar("bookingDate", { length: 255 }).notNull(),
  bookingTime: varchar("bookingTime", { length: 255 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  isInterested: tinyint("isInterested").default(0).notNull(),
  playerCount: int("playerCount").notNull(),
  phoneNumber: varchar("phonenumber", { length: 100 }).notNull(),
  addtionalRequest: text("addtionalRequest"),
  userId: varchar("userId", { length: 50 }),
  courseId: varchar("courseId", { length: 50 }),
  paymentLink: varchar("paymentLink", { length: 255 }),
  teeTimeId: varchar("teeTimeId", { length: 36 }),
  paymentId: varchar("paymentId", { length: 36 }),
});

export type InsertPhoneBooking = InferInsertModel<typeof phoneBookingEntry>;

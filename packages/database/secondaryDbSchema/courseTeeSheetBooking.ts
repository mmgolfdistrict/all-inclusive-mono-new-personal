import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseTeeSheetBooking = mySqlTable("courseTeeSheetBooking", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  reservationId: varchar("reservationId", { length: 36 }),
  bookingDateTime: datetime("bookingDateTime", { mode: "string", fsp: 3 }).notNull(),
  playDateTime: datetime("playDateTime", { mode: "string", fsp: 3 }).notNull(),
  playerCount: tinyint("playerCount").notNull(),
  holes: tinyint("holes").notNull(),
  noshowCount: tinyint("noshowCount"),
  name: varchar("name", { length: 255 }),
  totalAmount: int("totalAmount"),
  bookingSource: varchar("bookingSource", { length: 25 }),
  comments: text("comments"),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertCourseTeeSheetBooking = InferSelectModel<typeof courseTeeSheetBooking>;

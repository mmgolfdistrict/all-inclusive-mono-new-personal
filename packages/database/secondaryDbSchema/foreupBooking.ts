import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const foreupBooking = mySqlTable(
  "foreupBooking",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    reservationId: varchar("reservationId", { length: 36 }),
    type: varchar("type", { length: 25 }),
    attributes_isReround: boolean("attributes_isReround"),
    attributes_type: varchar("attributes_type", { length: 25 }),
    attributes_status: varchar("attributes_status", { length: 15 }),
    attributes_start: varchar("attributes_start", { length: 25 }),
    attributes_end: varchar("attributes_end", { length: 25 }),
    attributes_duration: tinyint("attributes_duration"),
    attributes_playerCount: tinyint("attributes_playerCount"),
    attributes_holes: tinyint("attributes_holes"),
    attributes_noShowCount: tinyint("attributes_noShowCount"),
    attributes_title: varchar("attributes_title", { length: 127 }),
    attributes_details: varchar("attributes_details", { length: 2048 }),
    attributes_teeSheetSideId: varchar("attributes_teeSheetSideId", { length: 15 }),
    attributes_bookingSource: varchar("attributes_bookingSource", { length: 15 }),
    attributes_lastUpdated: varchar("attributes_lastUpdated", { length: 25 }),
    attributes_dateBooked: varchar("attributes_dateBooked", { length: 25 }),
    attributes_dateCancelled: varchar("attributes_dateCancelled", { length: 25 }),
    attributes_bookingClassId: varchar("attributes_bookingClassId", { length: 15 }),
    attributes_isTrade: boolean("attributes_isTrade"),
    attributes_externalUrl: varchar("attributes_externalUrl", { length: 1024 }),
    attributes_externalId: varchar("attributes_externalId", { length: 36 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdReservationIdUnique: unique("foreupBooking_CourseId_ReservationId_Unique").on(
        table.courseId,
        table.reservationId
      ),
    };
  }
);

export type InsertForeUPBooking = InferSelectModel<typeof foreupBooking>;

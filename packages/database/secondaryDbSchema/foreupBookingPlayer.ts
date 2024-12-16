import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const foreupBookingPlayer = mySqlTable(
  "foreupBookingPlayer",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    reservationId: varchar("reservationId", { length: 36 }).notNull(),
    foreupBookingId: varchar("foreupBookingId", { length: 36 }).notNull(),
    type: varchar("type", { length: 25 }),
    bookedPlayerId: varchar("bookedPlayerId", { length: 36 }).notNull(),
    attributes_name: varchar("attributes_name", { length: 255 }),
    attributes_noShow: boolean("attributes_noShow"),
    attributes_paid: boolean("attributes_paid"),
    attributes_priceClassId: varchar("attributes_priceClassId", { length: 36 }),
    attributes_priceClass: varchar("attributes_priceClass", { length: 36 }),
    attributes_personId: varchar("attributes_personId", { length: 36 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdReservationIdbookedPlayerIdUnique: unique(
        "foreupBookingPlayer_CourseId_ReservationId_bookedPlayerId_Unique"
      ).on(table.courseId, table.reservationId, table.bookedPlayerId),
    };
  }
);

export type InsertForeUPBookingPlayer = InferSelectModel<typeof foreupBookingPlayer>;

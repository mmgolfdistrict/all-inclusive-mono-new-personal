import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { bigint, boolean, datetime, double, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const foreupBookingSale = mySqlTable(
  "foreupBookingSale",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    nid: bigint("nid", { mode: "number", unsigned: true }).notNull().autoincrement().unique(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    reservationId: varchar("reservationId", { length: 36 }).notNull(),
    foreupBookingId: varchar("foreupBookingId", { length: 36 }).notNull(),
    type: varchar("type", { length: 25 }),
    saleId: varchar("saleId", { length: 36 }).notNull(),
    attributes_saleTime: varchar("attributes_saleTime", { length: 25 }),
    attributes_comment: varchar("attributes_comment", { length: 2048 }),
    attribute_guestCount: tinyint("attribute_guestCount"),
    attribute_number: varchar("attribute_number", { length: 36 }),
    attribute_paymentType: varchar("attribute_paymentType", { length: 256 }),
    attribute_refundComment: varchar("attribute_refundComment", { length: 255 }),
    attribute_refundReason: varchar("attribute_refundReason", { length: 255 }),
    attributes_total: double("attributes_total"),
    attributes_subtotal: double("attributes_subtotal"),
    attributes_tax: double("attributes_tax"),
    attributes_teetime_id: varchar("attributes_teetime_id", { length: 36 }),
    attributes_deleted: boolean("attributes_deleted").default(false),
    attributes_deletedAt: varchar("attributes_deletedAt", { length: 25 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdReservationIdsaleIdUnique: unique("foreupBookingSale_CourseId_ReservationId_saleId_Unique").on(
        table.courseId,
        table.reservationId,
        table.saleId
      ),
    };
  }
);

export type InsertForeUPBookingSale = InferSelectModel<typeof foreupBookingSale>;

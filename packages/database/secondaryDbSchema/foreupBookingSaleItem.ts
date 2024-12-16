import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, decimal, double, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const foreupBookingSaleItem = mySqlTable(
  "foreupBookingSaleItem",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    reservationId: varchar("reservationId", { length: 36 }).notNull(),
    foreupBookingId: varchar("foreupBookingId", { length: 36 }).notNull(),
    type: varchar("type", { length: 25 }),
    saleItemId: varchar("saleItemId", { length: 36 }).notNull(),
    attributes_total: double("attributes_total"),
    attributes_subTotal: double("attributes_subTotal"),
    attributes_tax: double("attributes_tax"),
    attributes_quantity: tinyint("attributes_quantity"),
    attributes_unitPrice: double("attributes_unitPrice"),
    attributes_unitCost: double("attributes_unitCost"),
    attributes_discountPercent: double("attributes_discountPercent"),
    attributes_profit: double("attributes_profit"),
    attributes_sale_id: varchar("attributes_sale_id", { length: 36 }),
    attributes_item_id: varchar("attributes_item_id", { length: 36 }),
    attributes_price_category: varchar("attributes_price_category", { length: 36 }),
    attributes_type: varchar("attributes_type", { length: 15 }),
    attributes_holes: tinyint("attributes_holes"),
    attributes_player_count: tinyint("attributes_player_count"),
    attributes_teesheet_name: varchar("attributes_teesheet_name", { length: 255 }),
    attributes_teetime_id: varchar("attributes_teetime_id", { length: 36 }),
    attributes_department: varchar("attributes_department", { length: 36 }),
    attributes_category: varchar("attributes_category", { length: 36 }),
    attributes_itemNumber: varchar("attributes_itemNumber", { length: 36 }),
    attributes_itemId: varchar("attributes_itemId", { length: 36 }),
    attributes_name: varchar("attributes_name", { length: 255 }),
    attributes_description: varchar("attributes_description", { length: 2048 }),
    attributes_priceClassId: varchar("attributes_priceClassId", { length: 36 }),
    attributes_priceClass: varchar("attributes_priceClass", { length: 36 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdReservationIdsaleItemIdUnique: unique(
        "foreupBookingSaleItem_CourseId_ReservationId_saleItemId_Unique"
      ).on(table.courseId, table.reservationId, table.saleItemId),
    };
  }
);

export type InsertForeUPBookingSaleItem = InferSelectModel<typeof foreupBookingSaleItem>;

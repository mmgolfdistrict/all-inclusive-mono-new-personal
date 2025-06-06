import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, index, int, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingMerchandise = mySqlTable('bookingMerchandise', {
  id: varchar('id', { length: 36 }).notNull().primaryKey(),
  bookingId: varchar('bookingId', { length: 36 }).notNull(),
  courseMerchandiseId: varchar('courseMerchandiseId', { length: 36 }).notNull(),
  qty: tinyint('qty').notNull(),
  createdDateTime: datetime('createdDateTime', { mode: 'string', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime('lastUpdatedDateTime', { mode: 'string', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
  merchandiseFeePerItem: int("merchandiseFeePerItem").default(0),
  merchandiseTaxAmountPerItem: int("merchandiseTaxAmountPerItem").default(0),
},
  (table) => ({
    bookingIdIdx: index("bookingMerchandise_bookingId_idx").on(table.bookingId),
    courseMerchandiseIdIdx: index("bookingMerchandise_courseMerchandiseId_idx").on(table.courseMerchandiseId),
  })
);

export type InsertBookingMerchandise = InferInsertModel<typeof bookingMerchandise>;

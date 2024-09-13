import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingAdjustmentEntry = mySqlTable("bookingAdjustmentEntry", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  bookingAdjustmentId: varchar("bookingAdjustmentId", { length: 36 }).notNull(),
  entryTypeId: varchar("entryTypeId", { length: 25 }).notNull(),
  entryId: varchar("entryId", { length: 36 }).notNull(),
  amount: int("amount").notNull(),
  comment: varchar("comment", { length: 2048 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertBookingAdjustmentEntry = InferSelectModel<typeof bookingAdjustmentEntry>;

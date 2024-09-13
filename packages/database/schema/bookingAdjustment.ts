import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingAdjustment = mySqlTable("bookingAdjustment", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  bookingId: varchar("bookingId", { length: 36 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertBookingAdjustment = InferSelectModel<typeof bookingAdjustment>;

import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, smallint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingslots = mySqlTable("bookingSlots", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  slotnumber: varchar("externalSlotId", { length: 191 }).notNull(),
  bookingId: varchar("bookingId", { length: 191 }).notNull(),
  customerId: varchar("customerId", { length: 191 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  slotPosition: smallint("slotPosition").default(0),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
  ),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

export type InsertBookingSlots = InferSelectModel<typeof bookingslots>;

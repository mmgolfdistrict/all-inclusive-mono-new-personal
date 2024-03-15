import { InferSelectModel } from "drizzle-orm";
import { boolean, smallint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingslots = mySqlTable("bookingSlots", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  slotnumber: varchar("slotnumber", { length: 191 }).notNull(),
  bookingId: varchar("bookingId", { length: 191 }).notNull(),
  customerId: varchar("customerId", { length: 191 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  slotPosition: smallint("slotPosition").default(0),
});

export type InsertBookingSlots = InferSelectModel<typeof bookingslots>;

import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, smallint, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const invitedTeeTime = mySqlTable("invitedTeeTime", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  teeTimeId: varchar("teeTimeId", { length: 191 }).notNull(),
  bookingId: varchar("bookingId", { length: 191 }),
  bookingSlotId: varchar("bookingSlotId", { length: 191 }),
  slotPosition: smallint("slotPosition").default(0),
  status: tinyint("status").default(0).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
  ),
});

export type InsertInvitedTeeTime = InferSelectModel<typeof invitedTeeTime>;

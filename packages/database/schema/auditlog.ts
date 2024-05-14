import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const auditLog = mySqlTable("auditLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  ip: varchar("ip", { length: 50 }).notNull(),
  userId: varchar("userId", { length: 36 }).notNull(),
  teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
  bookingId: varchar("bookingId", { length: 36 }).notNull(),
  listingId: varchar("listingId", { length: 36 }).notNull(),
  eventId: varchar("eventId", { length: 50 }).notNull(),
  json: varchar("json", { length: 2048 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertAuditLog = InferInsertModel<typeof auditLog>;

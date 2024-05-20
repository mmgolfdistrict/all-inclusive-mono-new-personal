import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const errorLog = mySqlTable("errorLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  applicationName: varchar("applicationName", { length: 50 }),
  clientIP: varchar("clientIP", { length: 25 }),
  userId: varchar("userId", { length: 36 }),
  url: varchar("userId", { length: 1024 }),
  userAgent: varchar("userAgent", { length: 1024 }),
  message: varchar("userAgent", { length: 255 }),
  stackTrace: varchar("stackTrace", { length: 2048 }),
  additionalDetailsJSON: varchar("additionalDetailsJSON", { length: 2048 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertAuditLog = InferInsertModel<typeof errorLog>;

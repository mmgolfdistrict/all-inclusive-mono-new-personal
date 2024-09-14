import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const systemNotification = mySqlTable("systemNotification", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  startDate: datetime("startDate", { mode: "string", fsp: 3 }).notNull(),
  endDate: datetime("endDate", { mode: "string", fsp: 3 }).notNull(),
  shortMessage: varchar("shortMessage", { length: 255 }).notNull(),
  longMessage: varchar("longMessage", { length: 2048 }),
  displayType: varchar("displayType", { length: 36 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertSystemNotification = InferSelectModel<typeof systemNotification>;

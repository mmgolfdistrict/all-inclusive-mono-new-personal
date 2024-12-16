import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const majorEvents = mySqlTable("majorEvents", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  eventName: varchar("eventName", { length: 191 }).notNull(),
  startDate: datetime("startDate", { mode: "string", fsp: 3 }).notNull(),
  endDate: datetime("endDate", { mode: "string", fsp: 3 }).notNull(),
  eventStartDate: datetime("eventStartDate", { mode: "string", fsp: 3 }),
  eventEndDate: datetime("eventEndDate", { mode: "string", fsp: 3 }),
  iconAssetId: varchar("iconAssetId", { length: 36 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertMajorEvents = InferSelectModel<typeof majorEvents>;

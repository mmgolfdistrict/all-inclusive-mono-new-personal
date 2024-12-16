import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseTeeSheetBookingLog = mySqlTable("courseTeeSheetBookingLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  startDateTime: datetime("startDateTime", { mode: "string", fsp: 3 }).notNull(),
  endDateTime: datetime("endDateTime", { mode: "string", fsp: 3 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertCourseTeeSheetBookingLog = InferSelectModel<typeof courseTeeSheetBookingLog>;

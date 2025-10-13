import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseGlobalNotification = mySqlTable("courseGlobalNotification", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  startDateTime: datetime("startDateTime", { mode: "string", fsp: 3 }).notNull(),
  endDateTime: datetime("endDateTime", { mode: "string", fsp: 3 }).notNull(),
  shortMessage: varchar("shortMessage", { length: 255 }).notNull(),
  longMessage: varchar("longMessage", { length: 2048 }),
  displayType: varchar("displayType", { length: 36 }).notNull(),
  bgColor: varchar("bgColor", { length: 15 }).notNull().default("red"),
  color: varchar("color", { length: 15 }).notNull().default("white"),
  sortOrder: tinyint("sortOrder").default(0).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertCourseGlobalNotification = InferSelectModel<typeof courseGlobalNotification>;

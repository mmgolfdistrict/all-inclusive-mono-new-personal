import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseUser = mySqlTable("courseUser", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  userId: varchar("userId", { length: 36 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertCourseUser = InferSelectModel<typeof courseUser>;

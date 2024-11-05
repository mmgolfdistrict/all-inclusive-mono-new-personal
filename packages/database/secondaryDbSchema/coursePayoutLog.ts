import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const coursePayoutLog = mySqlTable("coursePayoutLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  messagesJSON: text("messagesJSON").notNull(),
  numberOfCoursesRetrieved: int("numberOfCoursesRetrieved").notNull(),
  numberOfCoursesSucceeded: int("numberOfCoursesSucceeded").notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertCoursePayoutLog = InferSelectModel<typeof coursePayoutLog>;

import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseMarkup = mySqlTable(
  "courseMarkup",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    fromDay: int("fromDay").notNull(),
    toDay: int("toDay").notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull().default(""),
    markUp: int("markUp").notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    courseIdIdx: index("CourseMarkup_courseId_idx").on(table.courseId),
  })
);

export type CourseMarkup = InferInsertModel<typeof courseMarkup>;

import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const teeTimeIndexLogs = mySqlTable(
  "teeTimeIndexLogs",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    indexDay: datetime("indexDay", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    courseDateUniqueConstraint: unique("course_date_unique_constraint").on(table.courseId, table.indexDay),
  })
);

export type SelectTeeTimeIndexLogs = InferSelectModel<typeof teeTimeIndexLogs>;
export type InsertTeeTimeIndexLogs = InferInsertModel<typeof teeTimeIndexLogs>;

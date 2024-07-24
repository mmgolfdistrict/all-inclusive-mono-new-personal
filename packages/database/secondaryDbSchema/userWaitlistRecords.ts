import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { date, datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const userWaitlistRecords = mySqlTable(
  "userWaitlistRecord",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    totalUsers: int("totalUsers").notNull(),
    usersDone: int("usersDone").notNull(),
    date: date("date").notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    date: index("userWaitlistRecord_date_idx").on(table.date),
    courseId: index("userWaitlistRecord_courseId_idx").on(table.courseId),
  })
);

export type SelectUserWaitlistRecords = InferSelectModel<typeof userWaitlistRecords>;
export type InsertUserWaitlistRecords = InferInsertModel<typeof userWaitlistRecords>;

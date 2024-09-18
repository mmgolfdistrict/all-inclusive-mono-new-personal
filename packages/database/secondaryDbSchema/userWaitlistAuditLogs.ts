import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, index, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const userWaitlistAuditLogs = mySqlTable(
  "userWaitlistAuditLog",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    json: varchar("json", { length: 2048 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    userId: index("userWaitlistRecord_userId_idx").on(table.userId),
    courseId: index("userWaitlistRecord_courseId_idx").on(table.courseId),
  })
);

export type SelectUserWaitlistAuditLogs = InferSelectModel<typeof userWaitlistAuditLogs>;
export type InsertUserWaitlistAuditLogs = InferInsertModel<typeof userWaitlistAuditLogs>;

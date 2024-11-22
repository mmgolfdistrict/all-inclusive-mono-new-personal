import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { boolean, date, datetime, index, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const userWaitlistAuditLogs = mySqlTable(
  "userWaitlistAuditLog",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    date: date("date"),
    startTime: int("startTime").notNull().default(0),
    endTime: int("endTime").notNull().default(0),
    playerCount: int("playerCount").notNull().default(0),
    isCancelledNotification: boolean("isCancelledNotification").notNull().default(false),
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
    date: index("userWaitlistRecord_date_idx").on(table.date),
    isCancelledNotification: index("userWaitlistRecord_isCancelledNotification_idx").on(table.isCancelledNotification),
  })
);

export type SelectUserWaitlistAuditLogs = InferSelectModel<typeof userWaitlistAuditLogs>;
export type InsertUserWaitlistAuditLogs = InferInsertModel<typeof userWaitlistAuditLogs>;

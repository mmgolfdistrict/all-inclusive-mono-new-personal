import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, index, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const userReminderNotificationAuditLogs = mySqlTable(
  "userReminderNotificationAuditLog",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    notificationJSON: text("notificationJSON"),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    userId: index("userReminderNotification_userId_idx").on(table.userId),
    courseId: index("userReminderNotification_courseId_idx").on(table.courseId),
    createdAt: index("userReminderNotification_createdAt_idx").on(table.createdDateTime),
  })
);

export type SelectUserReminderNotificationAuditLogs = InferSelectModel<typeof userReminderNotificationAuditLogs>;
export type InsertUserReminderNotificationAuditLogs = InferInsertModel<typeof userReminderNotificationAuditLogs>;

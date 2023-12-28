import { relations, sql } from "drizzle-orm";
import { boolean, index, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { users } from "./users";

export const notifications = mySqlTable(
  "notification",
  {
    id: varchar("id", { length: 36 }).notNull(),
    subject: varchar("subject", { length: 191 }),
    body: text("body"),
    readAt: timestamp("readAt", { mode: "string", fsp: 3 }),
    isRead: boolean("isRead").default(false).notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    deletedAt: timestamp("deletedAt", { mode: "string", fsp: 3 }),
    createdAt: timestamp("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    userId: varchar("userId", { length: 36 }),
    courseId: varchar("entityId", { length: 36 }),
  },
  (table) => {
    return {
      courseIdIdx: index("Notification_courseId_idx").on(table.courseId),
      userIdIdx: index("Notification_userId_idx").on(table.userId),
      notificationId: primaryKey(table.id),
    };
  }
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  entity: one(courses, {
    fields: [notifications.courseId],
    references: [courses.id],
  }),
}));

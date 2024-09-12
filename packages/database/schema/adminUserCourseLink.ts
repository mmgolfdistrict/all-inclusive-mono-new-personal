import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { adminUsers } from "./adminUsers";

export const adminUserCourseLink = mySqlTable(
  "adminUserCourseLink",
  {
    id: varchar("id", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    adminUserId: varchar("adminUserId", { length: 36 }).notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    primaryKey: primaryKey({ columns: [table.courseId, table.adminUserId] }),
  }),
);

export const adminUserCourseRelations = relations(adminUserCourseLink, ({ one }) => ({
  courseProvider: one(courses, {
    fields: [adminUserCourseLink.courseId],
    references: [courses.id],
  }),
  adminUserId: one(adminUsers, {
    fields: [adminUserCourseLink.adminUserId],
    references: [adminUsers.id],
  }),
}));

export type SelectAdminUserCourseLink = InferSelectModel<typeof adminUserCourseLink>;
export type InsertAdminUserCourseLink = InferSelectModel<typeof adminUserCourseLink>;

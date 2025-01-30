import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { adminUsers } from "./adminUsers";
import { courses } from "./courses";

export const adminUserCourse = mySqlTable(
  "adminUserCourse",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
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
    primaryKey: unique("UK_admin_user_id_course_id").on(table.courseId, table.adminUserId),
  })
);

export const adminUserCourseRelations = relations(adminUserCourse, ({ one }) => ({
  courseProvider: one(courses, {
    fields: [adminUserCourse.courseId],
    references: [courses.id],
  }),
  adminUserId: one(adminUsers, {
    fields: [adminUserCourse.adminUserId],
    references: [adminUsers.id],
  }),
}));

export type SelectAdminUserCourse = InferSelectModel<typeof adminUserCourse>;
export type InsertAdminUserCourse = InferSelectModel<typeof adminUserCourse>;

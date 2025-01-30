import type { InferInsertModel } from "drizzle-orm";
import { relations, sql, type InferSelectModel } from "drizzle-orm";
import { boolean, datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const adminRoles = mySqlTable(
  "adminRole",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    role: varchar("role", { length: 191 }).notNull(),
    description: varchar("description", { length: 255 }),
    courseId: varchar("courseId", { length: 36 }),
    isActive: boolean("isActive").notNull().default(true),
    isDeleted: boolean("isDeleted").notNull().default(false),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_role_isDeleted: unique("unique_role_isDeleted").on(table.role, table.isDeleted),
    };
  }
);

relations(adminRoles, ({ one }) => ({
  course: one(courses, {
    fields: [adminRoles.courseId],
    references: [courses.id],
  }),
}));

export type SelectAdminRole = InferSelectModel<typeof adminRoles>;
export type InsertAdminRole = InferInsertModel<typeof adminRoles>;

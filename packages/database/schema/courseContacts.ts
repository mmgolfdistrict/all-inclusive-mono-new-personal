import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, index, timestamp, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const courseContacts = mySqlTable(
  "courseContact",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    firstName: varchar("firstName", { length: 25 }).notNull(),
    lastName: varchar("lastName", { length: 25 }).notNull(),
    title: varchar("title", { length: 25 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone1: varchar("phone1", { length: 25 }),
    sendNotification: boolean("sendNotification").notNull().default(true),
    createdDateTime: timestamp("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: timestamp("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    internalName: varchar("internalName", { length: 255 }),
    countryCode:varchar('countryCode',{length:10})
  },
  (table) => {
    return {
      id: index("adminUser_id_idx").on(table.id),
      courseId: index("adminUser_courseId_idx").on(table.courseId),
      email: index("adminUser_email_idx").on(table.email),
    };
  }
);
export const adminUsersRelations = relations(courseContacts, ({ one }) => ({
  courses: one(courses),
}));
export type SelectCourseContacts = InferSelectModel<typeof courseContacts>;
export type InsertCourseContacts = InferInsertModel<typeof courseContacts>;

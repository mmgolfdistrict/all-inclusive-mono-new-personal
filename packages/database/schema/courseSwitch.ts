import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, foreignKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const courseSwitch = mySqlTable(
  "courseSwitch",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    switchableCourseId: varchar("switchableCourseId", { length: 36 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    fk_courseId: foreignKey({
      columns: [table.courseId],
      foreignColumns: [courses.id],
    }),
    fk_switchableCourseId: foreignKey({
      columns: [table.switchableCourseId],
      foreignColumns: [courses.id],
    }),
  })
);

export type SelectCourseSwitch = InferSelectModel<typeof courseSwitch>;
export type InsertCourseSwitch = InferInsertModel<typeof courseSwitch>;

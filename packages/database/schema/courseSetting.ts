import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, index, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseSetting = mySqlTable(
  "courseSetting",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    internalName: varchar("internalName", { length: 50 }).notNull(),
    value: varchar("value", { length: 1024 }).notNull(),
    datatype: varchar("datatype", { length: 32 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_course_internal: unique("unique_course_internal").on(table.courseId, table.internalName),
      courseIdIdx: index("CourseSetting_courseId_idx").on(table.courseId),
    };
  }
);

export type SelectCourseSetting = InferSelectModel<typeof courseSetting>;
export type InsertCourseSetting = InferInsertModel<typeof courseSetting>;

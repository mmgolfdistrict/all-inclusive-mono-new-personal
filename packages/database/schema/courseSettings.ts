import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, index, uniqueIndex, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseSettings = mySqlTable(
    "golf_district_courseSetting",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        courseId: varchar("courseId", { length: 36 }).notNull(),
        internalName: varchar("internalName", { length: 50 }).notNull(),
        value: varchar("value", { length: 1024 }).notNull(),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
        datatype: varchar("datatype", { length: 32 }),
    },
    (table) => ({
        uniqueCourseInternalIdx: uniqueIndex("unique_course_internal").on(
            table.courseId,
            table.internalName
        ),
        courseIdIdx: index("index_courseId").on(table.courseId),
    })
);

export type CourseSettings = InferInsertModel<typeof courseSettings>;



import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { varchar, text, datetime } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const courseAI = mySqlTable(
    "courseAI",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),

        courseId: varchar("courseId", { length: 36 })
            .notNull(),

        probedData: text("probedData").notNull(),

        userData: varchar("userData", { length: 4096 }),

        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),

        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
    }
);

// Relations
export const courseAIRelations = relations(courseAI, ({ one }) => ({
    course: one(courses, {
        fields: [courseAI.courseId],
        references: [courses.id],
    }),
}));

export type SelectCourseAI = InferSelectModel<typeof courseAI>;
export type InsertCourseAI = InferInsertModel<typeof courseAI>;
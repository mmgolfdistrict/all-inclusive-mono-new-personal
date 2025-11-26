import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { report } from "./report"; // import relation

export const reportCourse = mySqlTable(
    "reportCourse",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        reportId: varchar("reportId", { length: 36 }).notNull(),
        courseId: varchar("courseId", { length: 36 }).notNull(),
        isActive: boolean("isActive").notNull().default(true),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "date", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
    }
);

// Relations
export const reportCourseRelations = relations(reportCourse, ({ one }) => ({
    report: one(report, {
        fields: [reportCourse.reportId],
        references: [report.id],
    }),
}));

// Types
export type SelectReportCourse = InferSelectModel<typeof reportCourse>;
export type InsertReportCourse = InferInsertModel<typeof reportCourse>;
export type UpdateReportCourse = Omit<InferInsertModel<typeof reportCourse>, "id">;

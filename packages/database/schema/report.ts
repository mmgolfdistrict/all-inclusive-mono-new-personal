import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { reportCourse } from "./reportCourse"; // import relation

export const report = mySqlTable(
    "report",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        name: varchar("name", { length: 25 }).notNull(),
        description: varchar("description", { length: 255 }).notNull(),
        isActive: boolean("isActive").notNull().default(true),
        dashboardId: varchar("dashboardId", { length: 36 }).notNull(),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
    }
);

// Relations
export const reportRelations = relations(report, ({ many }) => ({
    reportCourse: many(reportCourse),
}));

// Types
export type SelectReport = InferSelectModel<typeof report>;
export type InsertReport = InferInsertModel<typeof report>;
export type UpdateReport = Omit<InferInsertModel<typeof report>, "id">;

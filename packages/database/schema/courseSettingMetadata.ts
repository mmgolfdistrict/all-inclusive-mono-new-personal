import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseSettingMetadata = mySqlTable(
    "courseSettingMetadata",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        internalName: varchar("internalName", { length: 50 }).notNull(),
        datatype: varchar("datatype", { length: 15 }).notNull(),
        defaultValue: varchar("defaultValue", { length: 127 }),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
    }
);

export type SelectCourseSettingMetadata = InferSelectModel<typeof courseSettingMetadata>;
export type InsertCourseSettingMetadata = InferInsertModel<typeof courseSettingMetadata>;
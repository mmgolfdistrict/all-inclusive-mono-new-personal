import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, index, smallint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const teeTimeIndexErrorLog = mySqlTable(
  "teeTimeIndexErrorLog",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    fromDay: smallint("fromDay").notNull(),
    toDay: smallint("toDay").notNull(),
    errorMessage: varchar("errorMessage", { length: 4096 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    courseIdIdx: index("TeeTimeIndexErrorLog_courseId_idx").on(table.courseId),
    providerIdIdx: index("TeeTimeIndexErrorLog_providerId_idx").on(table.providerId),
  })
);

export type SelectTeeTimeIndexErrorLog = InferSelectModel<typeof teeTimeIndexErrorLog>;
export type InsertTeeTimeIndexErrorLog = InferInsertModel<typeof teeTimeIndexErrorLog>;

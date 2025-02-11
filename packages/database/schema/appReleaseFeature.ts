import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const appReleaseFeature = mySqlTable("appReleaseFeature", {
  id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
  releaseId: varchar("releaseId", { length: 36 }).notNull(),
  ticketNumber: varchar("ticketNumber", { length: 15 }),
  name: varchar("name", { length: 255 }).notNull(),
  description: varchar("description", { length: 512 }).notNull(),
  engineerName: varchar("engineerName", { length: 50 }),
  isVisible: tinyint("isVisible").default(1),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type SelectAppReleaseFeature = InferSelectModel<typeof appReleaseFeature>;
export type InsertAppReleaseFeature = InferInsertModel<typeof appReleaseFeature>;

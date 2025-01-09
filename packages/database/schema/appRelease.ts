import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const appRelease = mySqlTable("appRelease", {
  id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
  releaseDateTime: datetime("releaseDateTime", { mode: "string", fsp: 3 }).notNull(),
  version: varchar("version", { length: 25 }).notNull(),
  isVisible: tinyint("isVisible").default(1),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`UTC_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`UTC_TIMESTAMP(3) ON UPDATE UTC_TIMESTAMP(3)`)
    .notNull(),
});

export type SelectAppRelease = InferSelectModel<typeof appRelease>;
export type InsertAppRelease = InferInsertModel<typeof appRelease>;

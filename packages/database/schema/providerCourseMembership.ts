import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, smallint, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const providerCourseMembership = mySqlTable("providerCourseMembership", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseMembershipId: varchar("courseMembershipId", { length: 36 }).notNull(),
  name: varchar("name", { length: 25 }).notNull(),
  description: varchar("description", { length: 255 }),
  configJSON: varchar("configJSON", { length: 1024 }),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});
export type InsertProviderCourseMembership = InferSelectModel<typeof providerCourseMembership>;

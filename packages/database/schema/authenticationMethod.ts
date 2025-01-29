import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const authenticationMethod = mySqlTable("authenticationMethod", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  value: int("value").notNull().unique(),
  name: varchar("name", { length: 25 }).notNull().unique(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type AuthenticationMethodSelectModel = InferSelectModel<typeof authenticationMethod>;

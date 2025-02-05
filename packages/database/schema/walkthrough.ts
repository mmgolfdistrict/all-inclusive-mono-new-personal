import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { InferSelectModel, sql } from "drizzle-orm";

export const walkthrough = mySqlTable("walkthrough", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  internalName: varchar("internalName", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 50 }).notNull(),
  description: varchar("description", { length: 255 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
  .notNull()
  .default(sql`CURRENT_TIMESTAMP(3)`),
lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
  .notNull()
  .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});


export type InsertSystemNotification = InferSelectModel<typeof walkthrough>;
import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, json, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const adminAuditLog = mySqlTable("adminAuditLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  changedByAdminUserID: varchar("changedByAdminUserID", { length: 36 }).notNull(),
  entityName: varchar("entityName", { length: 50 }).notNull(),
  changeData: json("changeData").notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertAdminAuditLog = InferInsertModel<typeof adminAuditLog>;

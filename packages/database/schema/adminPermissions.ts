import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { boolean, datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const adminPermissions = mySqlTable(
  "adminPermission",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    permission: varchar("permission", { length: 191 }).notNull(),
    description: varchar("description", { length: 255 }),
    isActive: boolean("isActive").notNull().default(true),
    isDeleted: boolean("isDeleted").notNull().default(false),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_permission_isDeleted: unique("unique_permission_isDeleted").on(table.permission, table.isDeleted),
    };
  }
);

export type SelectAdminPermission = InferSelectModel<typeof adminPermissions>;
export type InsertAdminPermission = InferInsertModel<typeof adminPermissions>;

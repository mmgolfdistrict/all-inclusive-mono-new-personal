import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const appSettings = mySqlTable(
  "appSetting",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    groupName: varchar("groupName", { length: 50 }),
    internalName: varchar("internalName", { length: 64 }).notNull(),
    caption: varchar("caption", { length: 64 }).notNull(),
    description: varchar("description", { length: 255 }),
    value: varchar("value", { length: 2046 }),
    datatype: varchar("datatype", { length: 32 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_group_internal: unique("unique_group_internal").on(table.groupName, table.internalName),
    };
  }
);

export type SelectAppSetting = InferSelectModel<typeof appSettings>;
export type InsertAppSetting = InferInsertModel<typeof appSettings>;

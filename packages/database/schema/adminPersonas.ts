import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const adminPersonas = mySqlTable(
  "adminPersona",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    persona: varchar("persona", { length: 191 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    caption: varchar("caption", { length: 64 }),
  },
  (table) => {
    return {
      unique_persona: unique("unique_persona").on(table.persona),
    };
  }
);

export type SelectAdminPersona = InferSelectModel<typeof adminPersonas>;
export type InsertAdminPersona = InferInsertModel<typeof adminPersonas>;

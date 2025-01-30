import type { InferInsertModel } from "drizzle-orm";
import { type InferSelectModel } from "drizzle-orm";
import { unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const adminPersonas = mySqlTable(
  "adminPersona",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    persona: varchar("persona", { length: 191 }).notNull(),
  },
  (table) => {
    return {
      unique_persona: unique("unique_persona").on(table.persona),
    };
  }
);

export type SelectAdminPersona = InferSelectModel<typeof adminPersonas>;
export type InsertAdminPersona = InferInsertModel<typeof adminPersonas>;

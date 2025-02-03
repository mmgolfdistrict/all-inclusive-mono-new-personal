import type { InferInsertModel } from "drizzle-orm";
import { relations, type InferSelectModel, sql } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { adminPersonas } from "./adminPersonas";
import { adminRoles } from "./adminRoles";

export const adminPersonaRole = mySqlTable(
  "adminPersonaRole",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    adminPersonaId: varchar("adminPersonaId", { length: 36 }).notNull(),
    adminRoleId: varchar("adminRoleId", { length: 36 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_admin_persona_id_role_id: unique("unique_admin_persona_id_role_id").on(
        table.adminPersonaId,
        table.adminRoleId
      ),
    };
  }
);

relations(adminPersonaRole, ({ one }) => ({
  adminPersona: one(adminPersonas, {
    fields: [adminPersonaRole.adminPersonaId],
    references: [adminPersonas.id],
  }),
  adminRole: one(adminRoles, {
    fields: [adminPersonaRole.adminRoleId],
    references: [adminRoles.id],
  }),
}));

export type SelectAdminPersonaRole = InferSelectModel<typeof adminPersonaRole>;
export type InsertAdminPersonaRole = InferInsertModel<typeof adminPersonaRole>;

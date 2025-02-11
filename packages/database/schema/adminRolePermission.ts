import type { InferInsertModel } from "drizzle-orm";
import { relations, type InferSelectModel, sql } from "drizzle-orm";
import { datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { adminPermissions } from "./adminPermissions";
import { adminRoles } from "./adminRoles";

export const adminRolePermission = mySqlTable(
  "adminRolePermission",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    adminRoleId: varchar("adminRoleId", { length: 36 }).notNull(),
    adminPermissionId: varchar("adminPermissionId", { length: 36 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      unique_admin_role_id_permission_id: unique("unique_admin_role_id_permission_id").on(
        table.adminRoleId,
        table.adminPermissionId
      ),
    };
  }
);

relations(adminRolePermission, ({ one }) => ({
  adminRole: one(adminRoles, {
    fields: [adminRolePermission.adminRoleId],
    references: [adminRoles.id],
  }),
  adminPermission: one(adminPermissions, {
    fields: [adminRolePermission.adminPermissionId],
    references: [adminPermissions.id],
  }),
}));

export type SelectAdminRolePermission = InferSelectModel<typeof adminRolePermission>;
export type InsertAdminRolePermission = InferInsertModel<typeof adminRolePermission>;

import type { InferInsertModel } from "drizzle-orm";
import { relations, type InferSelectModel } from "drizzle-orm";
import { unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { adminUsers } from "./adminUsers";
import { adminRoles } from "./adminRoles";

export const adminUserRole = mySqlTable(
  "adminUserRole",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
    adminUserId: varchar("adminUserId", { length: 36 }).notNull(),
    adminRoleId: varchar("adminRoleId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      unique_admin_user_id_role_id: unique("unique_admin_user_id_role_id").on(table.adminUserId, table.adminRoleId),
    };
  }
);

relations(adminUserRole, ({ one }) => ({
  adminUser: one(adminUsers, {
    fields: [adminUserRole.adminUserId],
    references: [adminUsers.id],
  }),
  adminRole: one(adminRoles, {
    fields: [adminUserRole.adminRoleId],
    references: [adminRoles.id],
  })
}));

export type SelectAdminUserRole = InferSelectModel<typeof adminUserRole>;
export type InsertAdminUserRole = InferInsertModel<typeof adminUserRole>;

import { relations } from "drizzle-orm";
import { index, primaryKey, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { entities } from "./entities";
import { users } from "./users";

export const entityAdmins = mySqlTable(
  "entityAdmin",
  {
    id: varchar("id", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    entityId: varchar("entityId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      entityIdIdx: index("EntityAdmin_entityId_idx").on(table.entityId),
      entityAdminId: primaryKey(table.id),
      entityAdminUserIdEntityIdKey: unique("EntityAdmin_userId_entityId_key").on(
        table.userId,
        table.entityId
      ),
    };
  }
);

export const entityAdminsRelations = relations(entityAdmins, ({ one }) => ({
  userIds: one(users, {
    fields: [entityAdmins.userId],
    references: [users.id],
  }),
  entityIds: one(entities, {
    fields: [entityAdmins.entityId],
    references: [entities.id],
  }),
}));

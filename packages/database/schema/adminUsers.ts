import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, index, timestamp, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const adminUsers = mySqlTable(
  "adminUser",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    cognitoId: varchar("cognitoId", { length: 36 }).notNull(),
    name: varchar("name", { length: 191 }),
    firstname: varchar("firstname", { length: 191 }),
    lastname: varchar("lastname", { length: 191 }),
    email: varchar("email", { length: 191 }).unique(),
    phoneNumber: varchar("phoneNumber", { length: 191 }),
    isActive: boolean("isActive").notNull().default(true),
    createdDateTime: timestamp("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: timestamp("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      id: index("adminUser_id_idx").on(table.id),
      email: index("adminUser_email_idx").on(table.email),
      cognitoId: index("adminUser_cognitoId_idx").on(table.cognitoId),
      lastUpdatedDateTime: index("adminUser_lastUpdatedDateTime_idx").on(table.lastUpdatedDateTime),
      createdDateTime: index("adminUser_createdDateTime_idx").on(table.createdDateTime),
    };
  }
);
export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
  courses: many(courses),
}));
export type SelectUser = InferSelectModel<typeof adminUsers>;
export type InsertUser = InferInsertModel<typeof adminUsers>;

import { relations, sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { users } from "./users";

export const withdrawals = mySqlTable("withdrawals", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  amount: int("amount").notNull(),
  createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

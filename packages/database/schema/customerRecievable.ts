import { sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const customerRecievable = mySqlTable("customerRecievable", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 191 }),
  transferId: varchar("transferId", { length: 191 }),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  amount: int("amount").notNull(),
  type: varchar("type", { length: 191 }),
  redeemAfter: datetime("redeemAfter", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type CustomerRecievable = InferSelectModel<typeof customerRecievable>;

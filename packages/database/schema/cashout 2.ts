import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const cashout = mySqlTable("cashout", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  customerId: varchar("customerId", { length: 191 }),
  amount: int("amount").notNull(),
  paymentDetailId: varchar("paymentDetailId", { length: 191 }),
  transferId: varchar("transferId", { length: 191 }),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
  ),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

export type InsertCashouts = InferSelectModel<typeof cashout>;

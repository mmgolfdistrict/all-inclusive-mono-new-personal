import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const splitPayments = mySqlTable("split_payments", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  amount: int("amount").notNull(),
  paymentId: varchar("paymentId", { length: 40 }).notNull(),
  bookingId: varchar("bookingId", { length: 40 }).notNull(),
  isActive: tinyint("isActive").default(1).notNull(),
  isPaid: tinyint("isPaid").default(0).notNull(),
  paymentLink: varchar("paymentLink", { length: 255 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3)`
  ),
  webhookStatus:varchar("webhookStatus",{length:255}),
  totalPayoutAmount:int("totalPayoutAmount").notNull(),
  paymentProcessingCharge:int("paymentProcessingCharge").notNull()
});
export type InsertSplitBooking = InferInsertModel<typeof splitPayments>;

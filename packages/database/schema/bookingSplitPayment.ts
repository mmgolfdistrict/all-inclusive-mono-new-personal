import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, date, datetime, index, int, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const bookingSplitPayment = mySqlTable("bookingSplitPayment", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  payoutAmount: int("payoutAmount").notNull(),
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
  collectedAmount:int("collectedAmount").notNull(),
  paymentProcessorPercent:int("paymentProcessorPercent").notNull(),
  isEmailOpened:tinyint("isEmailOpened").default(0).notNull(),
  expirationDateTime:datetime("expirationDateTime", { mode: "string", fsp: 3 }),
});
export type InsertSplitBooking = InferInsertModel<typeof bookingSplitPayment>;

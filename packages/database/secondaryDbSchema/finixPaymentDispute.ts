import { datetime, int, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";

export const finixPaymentDispute = mySqlTable("finixPaymentDispute", {
    id: varchar('id', { length: 36 }).notNull().primaryKey(),
    disputeId: varchar("disputeId", { length: 36}).notNull(),
    type: varchar("type", { length: 16 }).notNull(),
    orderNumber: varchar("orderNumber", { length: 16 }), 
    identity: varchar("identity", { length: 36 }).notNull(),
    status: varchar("status", { length: 25 }).notNull(),
    amount: int("amount").notNull(),
    paymentMethod: varchar("paymentMethod", { length: 15 }),
    paymentCreditCardHolderName: varchar("paymentCreditCardHolderName", { length: 50 }),
    paymentCreditCardISIN: varchar("paymentCreditCardISIN", { length: 10 }),
    paymentCreditCardLast4: varchar("paymentCreditCardLast4", { length: 4 }),
    paymentCreditCardExpMonth: tinyint("paymentCreditCardExpMonth"),
    paymentCreditCardExpYear: int("paymentCreditCardExpYear"),
    reason: varchar("reason", { length: 32 }),
    rawJSON: text("rawJSON"),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});
import { datetime, int, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";

export const hyperswitchPayment = mySqlTable(
    "hyperswitchPayment",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        paymentId: varchar("paymentId", { length: 36 }).notNull(),
        merchantId: varchar("merchantId", { length: 36 }).notNull(),
        customerId: varchar("customerId", { length: 36 }).notNull(),
        customerEMail: varchar("customerEMail", { length: 127 }).notNull(),
        status: varchar("status", { length: 25 }).notNull(),
        currency: varchar("currency", { length: 5 }).notNull(),
        amount: int("amount"),
        connector: varchar("connector", { length: 50 }),
        connectorTransactionId: varchar("connectorTransactionId", { length: 25 }),
        paymentCreditCardHolderName: varchar("paymentCreditCardHolderName", { length: 50 }),
        paymentMethod: varchar("paymentMethod", { length: 15 }),
        paymentCreditCardISIN: varchar("paymentCreditCardISIN", { length: 10 }),
        paymentCreditCardLast4: varchar("paymentCreditCardLast4", { length: 4 }),
        paymentCreditCardExpMonth: tinyint("paymentCreditCardExpMonth"),
        paymentCreditCardExpYear: int("paymentCreditCardExpYear"),
        metadata: varchar("metadata", { length: 1024 }),
        rawJSON: text("rawJSON"),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .notNull()
            .default(sql`CURRENT_TIMESTAMP(3)`),
            lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .notNull()
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
    }
);

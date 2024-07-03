import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, smallint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const customerPaymentDetail = mySqlTable("customerPaymentDetail", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  customerId: varchar("userId", { length: 191 }),
  paymentInstrumentId: varchar("externalPaymentInstrumentId", { length: 191 }),
  customerIdentity: varchar("externalIdentity", { length: 191 }),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
  ),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
  isActive: smallint("isActive").default(1),
  accountNumber: varchar("accountNumber", { length: 36 }),
  merchantId: varchar("merchantId", { length: 191 }),
});

export type InsertCustomerPaymentDetails = InferSelectModel<typeof customerPaymentDetail>;

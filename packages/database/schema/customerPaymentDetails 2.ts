import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const customerPaymentDetail = mySqlTable("customerPaymentDetail", {
  id: varchar("id", { length: 191 }).notNull().primaryKey(),
  customerId: varchar("customerId", { length: 191 }),
  paymentInstrumentId: varchar("paymentInstrumentId", { length: 191 }),
  customerIdentity: varchar("customerIdentity", { length: 191 }),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).default(
    sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`
  ),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).default(sql`CURRENT_TIMESTAMP(3)`),
});

export type InsertCustomerPaymentDetails = InferSelectModel<typeof customerPaymentDetail>;

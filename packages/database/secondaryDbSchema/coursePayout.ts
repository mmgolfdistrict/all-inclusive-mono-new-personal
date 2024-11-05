import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, double, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const coursePayout = mySqlTable("coursePayout", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  paymentProcessorPercentage: double("paymentProcessorPercentage").default(3).notNull(),
  externalTransactionId: varchar("externalTransactionId", { length: 36 }).notNull(),
  periodStartDateTime: datetime("periodStartDateTime", { mode: "string", fsp: 3 }).notNull(),
  periodEndDateTime: datetime("periodEndDateTime", { mode: "string", fsp: 3 }).notNull(),
  amountPaid: int("amountPaid").notNull(),
  amountToBePaid: int("amountToBePaid").notNull(),
  refundAmountToBeDeducted: int("refundAmountToBeDeducted").notNull(),
  description: varchar("description", { length: 1024 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertCoursePayout = InferSelectModel<typeof coursePayout>;

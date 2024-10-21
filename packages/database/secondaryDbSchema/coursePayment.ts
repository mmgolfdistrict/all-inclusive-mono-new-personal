import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const coursePayment = mySqlTable("coursePayment", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  paymentDate: datetime("paymentDate", { mode: "string", fsp: 3 }).notNull(),
  amountPaid: int("amountPaid").notNull(),
  description: varchar("description", { length: 1024 }).notNull(),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export type InsertCoursePayment = InferSelectModel<typeof coursePayment>;

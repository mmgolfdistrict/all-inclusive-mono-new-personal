import type { InferInsertModel } from "drizzle-orm";
import { type InferSelectModel } from "drizzle-orm";
import { int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const providerScheduleDetails = mySqlTable("providerScheduleDetails", {
  id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
  fromDay: int("fromDay").notNull(),
  toDay: int("toDay").notNull(),
  interval: int("interval").notNull(),
  providerId: varchar("providerId", { length: 36 }).notNull(),
});

export type SelectProviderScheduleDetails = InferSelectModel<typeof providerScheduleDetails>;
export type InsertProviderScheduleDetails = InferInsertModel<typeof providerScheduleDetails>;

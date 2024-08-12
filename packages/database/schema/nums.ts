import type { InferSelectModel } from "drizzle-orm";
import { int } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const nums = mySqlTable("nums", {
  value: int("value").notNull().primaryKey(),
});

export type InsertSystemNotification = InferSelectModel<typeof nums>;

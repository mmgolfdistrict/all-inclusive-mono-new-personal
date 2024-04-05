import type { InferInsertModel } from "drizzle-orm";
import { type InferSelectModel } from "drizzle-orm";
import { varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const jobs = mySqlTable("jobs", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  providerId: varchar("providerId", { length: 36 }).notNull(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  jobId: varchar("jobId", { length: 64 }),
  schedulerName: varchar("schedulerName", { length: 64 }),
});

export type SelectJobs = InferSelectModel<typeof jobs>;
export type InsertJobs = InferInsertModel<typeof jobs>;

import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const userSession = mySqlTable("userSession", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  userId: varchar("userId", { length: 36 }).notNull(),
  ip: varchar("ip", { length: 64 }),
  userAgent: varchar("userAgent", { length: 255 }),
  status: varchar("status", { length: 10 }).notNull(),
  courseId: varchar("courseId", { length: 36 }).notNull().default(""),
  loginMethod: varchar("loginMethod", { length: 15 }).notNull().default("EMAIL_PASSWORD"),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  ipinfoJSON: varchar("ipinfoJSON", { length: 2048 }),
});

export type InsertUserSession = InferSelectModel<typeof userSession>;

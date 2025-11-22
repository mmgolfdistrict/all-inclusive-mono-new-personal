import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, index, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const automatedAgentTestLogs = mySqlTable("automatedAgentTestLog", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  courseId: varchar("courseId", { length: 36 }).notNull(),
  conversationId: varchar("conversationId", { length: 36 }).notNull(),
  testKey: varchar("testKey", { length: 255 }).notNull(),
  testGoal: varchar("testGoal", { length: 2048 }),
  callStatus: varchar("callStatus", { length: 10 }).notNull(), // PENDING | FAILED | SUCESSFUL
  isPassed: boolean("isPassed").default(false).notNull(),
  reasoning: varchar("reasoning", { length: 4096 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
}, (table) => ({
  courseIdIndex: index("automatedAgentTestLog_courseId_index").on(table.courseId),
  conversationIdIndex: index("automatedAgentTestLog_conversationId_index").on(table.conversationId),
  testKeyIndex: index("automatedAgentTestLog_testKey_index").on(table.testKey),
}));

export type SelectAutomatedAgentTestLog = InferSelectModel<typeof automatedAgentTestLogs>;
export type InsertAutomatedAgentTestLog = InferInsertModel<typeof automatedAgentTestLogs>;


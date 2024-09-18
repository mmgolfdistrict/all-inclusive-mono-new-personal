import type { InferInsertModel } from "drizzle-orm";
import { sql, type InferSelectModel } from "drizzle-orm";
import { datetime, index, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const webhookEventLogs = mySqlTable(
  "webhookEventLogs",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    providerInternalId: varchar("providerInternalId", { length: 191 }).notNull(),
    json: varchar("json", { length: 2048 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    courseId: index("webhookEventLog_providerInternalId_idx").on(table.providerInternalId),
    createdDateTime: index("webhookEventLog_createdDateTime_idx").on(table.createdDateTime),
  })
);

export type SelectWebhookEventLogs = InferSelectModel<typeof webhookEventLogs>;
export type InsertWebhookEventLogs = InferInsertModel<typeof webhookEventLogs>;

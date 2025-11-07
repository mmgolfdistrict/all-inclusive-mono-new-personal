import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const phoneCallLogs = mySqlTable(
    "elevenlabsphonelog",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey(),
        forwardingPhoneNumber: varchar("forwardingPhoneNumber", { length: 25 }).notNull(),
        callerPhoneNumber: varchar("callerPhoneNumber", { length: 25 }).notNull(),
        sessionId: varchar("sessionId", { length: 36 }).notNull(),
        conversationId: varchar("conversationId", { length: 100 }),
        callSid: varchar("twillioCallSid", { length: 100 }),
        recordingSid: varchar("twillioRecordingSid", { length: 100 }),
        recordingUrl: text("twillioRecordingUrl"),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull()
    }
);

export type InsertPhoneCallLogs = InferInsertModel<typeof phoneCallLogs>;


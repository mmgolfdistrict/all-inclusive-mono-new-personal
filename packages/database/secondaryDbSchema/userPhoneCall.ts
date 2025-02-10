import { sql } from "drizzle-orm";
import { datetime, text, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "../schema/_table";

export const userPhoneCall = mySqlTable(
  "userPhoneCall",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    externalCallId: varchar("externalCallId", { length: 127 }).notNull(),
    fromPhoneNumber: varchar("fromPhoneNumber", { length: 25 }).notNull(),
    toPhoneNumber: varchar("toPhoneNumber", { length: 25 }).notNull(),
    type: varchar("type", { length: 10 }).notNull(),
    direction: varchar("direction", { length: 25 }),
    smsText: varchar("smsText", { length: 255 }),
    voicemailText: varchar("voicemailText", { length: 2048 }),
    voicemailURL: varchar("voicemailURL", { length: 1024 }),
    rawJSON: text("rawJSON"),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (table) => {
    return {
      userPhoneCallExternalCallID: unique("UK_userPhoneCall_externalCallID").on(table.externalCallId),
    };
  }
);

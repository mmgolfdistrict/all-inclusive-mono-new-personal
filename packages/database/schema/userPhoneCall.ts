import { sql } from "drizzle-orm";
import { datetime, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "../schema/_table";

export const userPhoneCall = mySqlTable("userPhoneCall", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  externalCallId: varchar("externalCallId", { length: 127 }).notNull(),
  fromPhoneNumber: varchar("fromPhoneNumber", { length: 25 }).notNull(),
  toPhoneNumber: varchar("toPhoneNumber", { length: 25 }).notNull(),
  voiceMailText: text("voiceMailText"),
  voicemailURL: varchar("voicemailURL", { length: 1024 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

import { datetime, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";

export const profanities = mySqlTable(
    "profanity",
    {
        id: varchar("id", { length: 36 }).notNull().primaryKey().unique(),
        profanityText: varchar("profanityText", { length: 50 }).notNull(),
        createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3)`)
            .notNull(),
        lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
            .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
            .notNull(),
    }
)
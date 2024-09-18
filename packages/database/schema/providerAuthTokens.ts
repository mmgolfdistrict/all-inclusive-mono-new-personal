import { datetime, index, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { sql } from "drizzle-orm";

export const providerAuthTokens = mySqlTable(
  "providerAuthToken",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    accessToken: varchar("accessToken", { length: 255 }).notNull(),
    refreshToken: varchar("refreshToken", { length: 255 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => ({
    uniqueKey: unique("provider_access_token_refresh_token_idx").on(table.providerId, table.accessToken, table.refreshToken),
    providerIndex: index("provider_index").on(table.providerId),
  })
);

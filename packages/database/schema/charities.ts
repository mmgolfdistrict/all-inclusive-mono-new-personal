import { relations, sql } from "drizzle-orm";
import { datetime, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { charityCourseLink } from "./charityCourseLink";

export const charities = mySqlTable("charities", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  name: varchar("name", { length: 127 }).notNull(),
  description: text("description"),
  logoAssetId: varchar("logo", { length: 36 }),
  createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export const charitiesRelations = relations(charities, ({ many }) => ({
  courseCharityLink: many(charityCourseLink),
}));

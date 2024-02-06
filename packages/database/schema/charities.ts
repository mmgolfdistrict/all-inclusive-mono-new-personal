import { relations } from "drizzle-orm";
import { text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { charityCourseLink } from "./charityCourseLink";

export const charities = mySqlTable("charities", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  name: varchar("name", { length: 191 }).notNull(),
  description: text("description"),
  logoAssetId: varchar("logo", { length: 36 }),
  //add extra data as needed here
});

export const charitiesRelations = relations(charities, ({ many }) => ({
  courseCharityLink: many(charityCourseLink),
}));

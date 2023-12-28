import { InferSelectModel, relations } from "drizzle-orm";
import { primaryKey, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { assets } from "./assets";
import { providerCourseLink } from "./providersCourseLink";

export const providers = mySqlTable(
  "provider",
  {
    id: varchar("id", { length: 36 }).notNull(),
    internalId: varchar("internalId", { length: 191 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    description: text("description"),
    website: text("website"),
    logo: varchar("id", { length: 36 }),
  },
  (table) => {
    return {
      providerId: primaryKey(table.id),
    };
  }
);

export const providersRelations = relations(providers, ({ many, one }) => ({
  logo: one(assets, {
    fields: [providers.logo],
    references: [assets.id],
  }),
  providerCourseLinks: many(providerCourseLink),
}));

export type SelectProviders = InferSelectModel<typeof providers>;
export type InsertProviders = InferSelectModel<typeof providers>;

import type { InferInsertModel, InferSelectModel} from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, index, int, primaryKey, text, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { assets } from "./assets";
import { auctions } from "./auctions";
import { bookings } from "./bookings";
import { courses } from "./courses";
import { entityAdmins } from "./entityAdmins";

export const entities = mySqlTable(
  "entity",
  {
    id: varchar("id", { length: 191 }).notNull(),
    requiredTimeBeforeTeeTime: int("requiredTimeBeforeTeeTime"),
    name: varchar("name", { length: 191 }),
    description: text("description"),
    logo: varchar("logo", { length: 36 }),
    font: varchar("font", { length: 191 }).default("font-cal").notNull(),
    color1: varchar("color1", { length: 191 }).notNull(),
    color2: varchar("color2", { length: 191 }).default("ffffff").notNull(),
    color3: varchar("color3", { length: 191 }).notNull(),
    subdomain: varchar("subdomain", { length: 191 }),
    customDomain: varchar("customDomain", { length: 191 }),
    message404: text("message404"),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: datetime("updatedAt", { mode: "date", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedById: varchar("updatedById", { length: 36 }),
  },
  (table) => {
    return {
      entityId: primaryKey(table.id),
      entityCustomDomainKey: unique("Entity_customDomain_key").on(table.customDomain),
      customDomainIdx: index("Entity_customDomain_idx").on(table.customDomain),
      subDomainIdx: index("Entity_subdomain_idx").on(table.subdomain),
      entitySubdomainKey: unique("Entity_subdomain_key").on(table.subdomain),
    };
  }
);

export const entitiesRelations = relations(entities, ({ many, one }) => ({
  admins: many(entityAdmins),
  course: many(courses),
  // teeTimes: many(teeTimes),
  auction: many(auctions),
  booking: many(bookings),
  logo: one(assets, {
    fields: [entities.logo],
    references: [assets.id],
  }),
}));

export type SelectEntities = InferSelectModel<typeof entities>;
export type InsertEntities = InferInsertModel<typeof entities>;

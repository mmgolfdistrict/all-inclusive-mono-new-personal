import type { InferInsertModel, InferSelectModel} from "drizzle-orm";
import { relations } from "drizzle-orm";
import { index, int, primaryKey, text, timestamp, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { auctionAssets } from "./auctionAssets";
import { courses } from "./courses";
import { entities } from "./entities";
import { users } from "./users";

export const auctions = mySqlTable(
  "auction",
  {
    id: varchar("id", { length: 36 }).notNull(),
    name: varchar("name", { length: 191 }),
    description: text("description"),
    buyNowPrice: int("buyNowPrice"),
    extendedDescription: text("extendedDescription"),
    startDate: timestamp("startDate", { mode: "string", fsp: 3 }).notNull(),
    endDate: timestamp("endDate", { mode: "string", fsp: 3 }).notNull(),
    eventDate: timestamp("eventDate", { mode: "string", fsp: 3 }),
    eventLocation: varchar("eventLocation", { length: 191 }),
    eventTime: varchar("eventTime", { length: 191 }),
    startingPrice: int("startingPrice").notNull(),
    entityId: varchar("entityId", { length: 36 }),
    courseId: varchar("courseId", { length: 36 }),
    createdBy: varchar("createdBy", { length: 36 }),
    canceledBy: varchar("canceledBy", { length: 36 }),
  },
  (table) => {
    return {
      courseIdIdx: index("Auction_entityId_idx").on(table.courseId),
      auctionId: primaryKey(table.id),
    };
  }
);
export const auctionRelations = relations(auctions, ({ one, many }) => ({
  auctionAsset: many(auctionAssets),
  course: one(courses, {
    fields: [auctions.courseId],
    references: [courses.id],
  }),
  entity: one(entities, {
    fields: [auctions.entityId],
    references: [entities.id],
  }),
  createdBy: one(users, {
    fields: [auctions.createdBy],
    references: [users.id],
    relationName: "createdBy_user",
  }),
  canceledBy: one(users, {
    fields: [auctions.canceledBy],
    references: [users.id],
    relationName: "canceledBy_user",
  }),
}));
export type SelectAuctions = InferSelectModel<typeof auctions>;
export type InsertAuctions = InferInsertModel<typeof auctions>;

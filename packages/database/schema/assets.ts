import { InferInsertModel, InferSelectModel, relations, sql } from "drizzle-orm";
import { boolean, datetime, index, primaryKey, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { auctions } from "./auctions";
import { courseAssets } from "./courseAssets";
import { courses } from "./courses";
import { entities } from "./entities";
import { users } from "./users";

export const assets = mySqlTable(
  "asset",
  {
    id: varchar("id", { length: 36 }).notNull(),
    createdById: varchar("createdById", { length: 191 }),
    key: text("key").notNull(),
    cdn: varchar("cdn", { length: 191 }).notNull(),
    extension: varchar("extension", { length: 5 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    courseId: varchar("courseId", { length: 36 }),
    entityId: varchar("entityId", { length: 36 }),
    auctionId: varchar("auctionId", { length: 36 }),
    courseAssetId: varchar("courseAssetId", { length: 36 }),
    auctionAssetId: varchar("auctionAssetId", { length: 36 }),
  },
  (table) => {
    return {
      auctionIdIdx: index("Asset_auctionId_idx").on(table.auctionId),
      courseIdIdx: index("Asset_courseId_idx").on(table.courseId),
      extensionIdx: index("Asset_extension_idx").on(table.extension),
      assetId: primaryKey(table.id),
    };
  }
);

export const assetRelations = relations(assets, ({ one }) => ({
  course: one(courses, {
    fields: [assets.courseId],
    references: [courses.id],
  }),
  auction: one(auctions, {
    fields: [assets.auctionId],
    references: [auctions.id],
  }),
  user: one(users, {
    fields: [assets.createdById],
    references: [users.id],
  }),
  courseAsset: one(courseAssets, {
    fields: [assets.courseAssetId],
    references: [courseAssets.id],
  }),
  auctionAsset: one(auctions, {
    fields: [assets.auctionAssetId],
    references: [auctions.id],
  }),
  logo: one(entities, {
    fields: [assets.id],
    references: [entities.id],
  }),
}));

export type SelectAsset = InferSelectModel<typeof assets>;
export type InsertAsset = InferInsertModel<typeof assets>;

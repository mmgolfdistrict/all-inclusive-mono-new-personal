import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { index, int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { assets } from "./assets";
import { auctions } from "./auctions";

export const auctionAssets = mySqlTable(
  "auctionAsset",
  {
    id: varchar("id", { length: 36 }).notNull(),
    order: int("order").notNull().default(0),
    auctionId: varchar("auctionId", { length: 36 }).notNull(),
    assetId: varchar("assetId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      auctionIdIdx: index("AuctionAsset_auctionId_idx").on(table.auctionId),
      auctionAssetId: primaryKey(table.id),
    };
  }
);

export const auctionAssetsRelations = relations(auctionAssets, ({ one }) => ({
  auctionIds: one(auctions, {
    fields: [auctionAssets.auctionId],
    references: [auctions.id],
  }),
  assetIds: one(assets, {
    fields: [auctionAssets.assetId],
    references: [assets.id],
  }),
}));
export type SelectAuctionAsset = InferSelectModel<typeof auctionAssets>;
export type InsertAuctionAsset = InferInsertModel<typeof auctionAssets>;

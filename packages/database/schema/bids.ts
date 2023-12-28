import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { auctions } from "./auctions";
import { users } from "./users";

export const bids = mySqlTable(
  "bid",
  {
    id: varchar("id", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }),
    auctionId: varchar("auctionId", { length: 36 }).notNull(),
    paymentIntentClientSecret: varchar("paymentIntentClientSecret", { length: 255 }).notNull(),
    amount: int("amount").notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      auctionIdIdx: index("Bid_auctionId_idx").on(table.auctionId),
      userIdIdx: index("Bid_userId_idx").on(table.userId),
      bidId: primaryKey(table.id),
    };
  }
);

export const bidsRelations = relations(bids, ({ one }) => ({
  auction: one(auctions, {
    fields: [bids.auctionId],
    references: [auctions.id],
  }),
  user: one(users, {
    fields: [bids.userId],
    references: [users.id],
  }),
}));

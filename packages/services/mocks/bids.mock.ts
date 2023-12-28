import { bids } from "@golf-district/database/schema/bids";
import { currentUtcTimestamp } from "@golf-district/shared";
import { mockAuctions } from "./auctions.mock";
import { mockUsers } from "./user.mock";

export const mockBids: (typeof bids.$inferInsert)[] = [
  {
    id: "bid1",
    userId: "user1",
    auctionId: "auction5",
    paymentIntentClientSecret: "secret",
    amount: 100,
    isDeleted: false,
    createdAt: currentUtcTimestamp(),
  },
];

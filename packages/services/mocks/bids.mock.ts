import type { bids } from "@golf-district/database/schema/bids";
import { currentUtcTimestamp } from "@golf-district/shared";

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

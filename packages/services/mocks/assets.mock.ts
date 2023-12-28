import { type assets } from "@golf-district/database/schema/assets";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockAssets: (typeof assets.$inferInsert)[] = [
  {
    id: "asset1",
    createdById: "user1",
    key: "key1",
    cdn: "cdn.com",
    extension: "png",
    createdAt: currentUtcTimestamp(),
    isDeleted: false,
    courseId: "course1",
    auctionId: "auction1",
    courseAssetId: "courseasset1",
    auctionAssetId: "auctionasset1",
  },
];

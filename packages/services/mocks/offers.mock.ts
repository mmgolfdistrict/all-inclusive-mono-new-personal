import { offers } from "@golf-district/database/schema/offers";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockOffers: (typeof offers.$inferInsert)[] = [
  {
    id: "offer1",
    expiresAt: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    price: 100,
    createdAt: new Date(new Date().getTime() - 1000).toISOString().replace("T", " ").replace("Z", ""),
    status: "PENDING",
    isDeclined: false,
    isAccepted: false,
    isDeleted: false,
    buyerId: "user1",
    courseId: "course1",
    offeredBy: {
      userId: "user1",
    },
    ownedBy: {
      userId: "user1",
    },
  },
  {
    id: "offer1",
    expiresAt: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    price: 100,
    createdAt: new Date(new Date().getTime() - 1000).toISOString().replace("T", " ").replace("Z", ""),
    status: "REJECTED",
    isDeclined: false,
    isAccepted: false,
    isDeleted: false,
    buyerId: "user1",
    courseId: "course1",
    offeredBy: {
      userId: "user1",
    },
  },
  {
    id: "offer1",
    expiresAt: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    price: 100,
    createdAt: new Date(new Date().getTime() - 1000).toISOString().replace("T", " ").replace("Z", ""),
    status: "PENDING",
    isDeclined: false,
    isAccepted: false,
    isDeleted: true,
    buyerId: "user1",
    courseId: "course1",
    offeredBy: {
      userId: "user1",
    },
  },
];

import type { transfers } from "@golf-district/database/schema/transfers";

export const mockTransfers: (typeof transfers.$inferInsert)[] = [
  {
    id: "transfer1",
    amount: 100,
    createdAt: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    bookingId: "booking1",
    courseId: "course1",
    fromUserId: "user1",
    toUserId: "user2",
  },
];

import { lists } from "@golf-district/database/schema/lists";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockLists: (typeof lists.$inferInsert)[] = [
  {
    id: "list1",
    listPrice: 100,
    endTime: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    courseId: "course1",
    userId: "user1",
    teeTimeId: "teeTime1",
    createdAt: new Date(new Date().getTime() - 10000).toISOString().replace("T", " ").replace("Z", ""),
    status: "PENDING",
    isDeleted: false,
    minimumOfferPrice: 0,
    splitTeeTime: false,
  },
];

import type { favorites } from "@golf-district/database/schema/favorites";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockFavorites: (typeof favorites.$inferInsert)[] = [
  {
    id: "favorite1",
    userId: "user1",
    teeTimeId: "teeTime1",
    courseId: "course1",
    entityId: "entity1",
    listId: "list1",
    createdAt: currentUtcTimestamp,
  },
];

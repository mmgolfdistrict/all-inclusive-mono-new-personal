import type { notifications } from "@golf-district/database/schema/notifications";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockNotifications: (typeof notifications.$inferInsert)[] = [
  {
    id: "1",
    isDeleted: false,
    userId: "user1",
    entityId: "entity1",
  },
  {
    id: "notification1",
    subject: "subject1",
    body: "notification one body",
    readAt: currentUtcTimestamp,
    isRead: false,
    isDeleted: false,
    deletedAt: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    createdAt: new Date(new Date().getTime() - 10000).toISOString().replace("T", " ").replace("Z", ""),
    userId: "user1",
    entityId: "entity1",
  },
];

import type { bookings } from "@golf-district/database/schema/bookings";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockBookings: (typeof bookings.$inferInsert)[] = [
  {
    id: "booking1",
    purchasedAt: currentUtcTimestamp,
    purchasedPrice: 100,
    time: currentUtcTimestamp,
    withCart: true,
    isListed: true,
    numberOfHoles: 10,
    ownerId: "user1",
    courseId: "course1",
    teeTimeId: "time1",
    nameOnBooking: "user1",
    includesCart: true,
    listId: "list1",
    entityId: "entity1",
  },
];

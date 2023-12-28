import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockTeeTimes: (typeof teeTimes.$inferInsert)[] = [
  {
    id: "teeTime1",
    providerTeeTimeId: "providerTeeTime1",
    date: new Date(new Date().getTime() + 10000).toISOString().replace("T", " ").replace("Z", ""),
    time: 2200, //military time
    numberOfHoles: 18,
    maxPlayersPerBooking: 10,
    availableFirstHandSpots: 5,
    availableSecondHandSpots: 5,
    greenFee: 100,
    cartFee: 100,
    greenFeeTax: 10,
    cartFeeTax: 10,
    soldByProvider: "provider1",
    courseId: "course1",
    entityId: "entity1",
  },
];

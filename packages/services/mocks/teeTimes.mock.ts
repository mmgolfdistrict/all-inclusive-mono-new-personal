import type { teeTimes } from "@golf-district/database/schema/teeTimes";

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
    greenFeePerPlayer: 100,
    cartFeePerPlayer: 100,
    greenFeeTaxPerPlayer: 10,
    cartFeeTaxPerPlayer: 10,
    courseProvider: "provider1",
    courseId: "course1",
    entityId: "entity1",
  },
];

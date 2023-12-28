import { userBookingOffers } from "@golf-district/database/schema/userBookingOffers";
import { currentUtcTimestamp } from "@golf-district/shared";

export const mockUserBookingOffers: (typeof userBookingOffers.$inferInsert)[] = [
  {
    offerId: "offer1",
    bookingId: "booking1",
  },
];

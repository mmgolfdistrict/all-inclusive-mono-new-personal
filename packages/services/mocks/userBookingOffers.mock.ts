import type { userBookingOffers } from "@golf-district/database/schema/userBookingOffers";

export const mockUserBookingOffers: (typeof userBookingOffers.$inferInsert)[] = [
  {
    offerId: "offer1",
    bookingId: "booking1",
  },
];

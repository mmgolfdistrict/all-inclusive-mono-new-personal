import type { InferInsertModel } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { boolean, index, mysqlEnum, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { bookings } from "./bookings";
import { offers } from "./offers";

export const userBookingOffers = mySqlTable(
  "userBookingOffer",
  {
    offerId: varchar("offerId", { length: 36 }).notNull(),
    bookingId: varchar("bookingId", { length: 36 }).notNull(),
    status: mysqlEnum("status", ["PENDING", "ACCEPTED", "REJECTED"]).default("PENDING").notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
  },
  (table) => {
    return {
      pky: primaryKey(table.offerId, table.bookingId),
      offerIdIdx: index("UserBookingOffer_offerId_idx").on(table.offerId),
      bookingIdIdx: index("UserBookingOffer_bookingId_idx").on(table.bookingId),
    };
  }
);

export const userBookingOffersRelations = relations(userBookingOffers, ({ one, many }) => ({
  booking: one(bookings, {
    fields: [userBookingOffers.bookingId],
    references: [bookings.id],
  }),
  offer: one(offers, {
    fields: [userBookingOffers.offerId],
    references: [offers.id],
  }),
}));

export type InsertUserBookingOffer = InferInsertModel<typeof userBookingOffers>;

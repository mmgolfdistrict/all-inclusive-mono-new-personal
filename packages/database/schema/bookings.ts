import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { lists } from "./lists";
import { teeTimes } from "./teeTimes";
import { transfers } from "./transfers";
import { userBookingOffers } from "./userBookingOffers";
import { users } from "./users";

export const bookings = mySqlTable(
  "booking",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    purchasedAt: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    purchasedPrice: int("greenFeePerPlayer").notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    isListed: boolean("isListed").default(false).notNull(),
    numberOfHoles: int("numberOfHoles").default(18).notNull(),
    providerBookingId: varchar("providerBookingId", { length: 191 }).notNull(),
    minimumOfferPrice: int("minimumOfferPrice").default(0).notNull(),
    ownerId: varchar("ownerId", { length: 36 }).notNull(),
    teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
    nameOnBooking: varchar("nameOnBooking", { length: 191 }).default("guest").notNull(),
    includesCart: boolean("includesCart").default(false).notNull(),
    listId: varchar("listId", { length: 36 }),
    weatherGuaranteeId: varchar("weatherGuaranteeId", { length: 36 }),
    weatherGuaranteeAmount: int("weatherGuaranteeAmount").default(0),
    isActive: boolean("isActive").default(true).notNull(),
    cartId: varchar("cartId", { length: 36 }).notNull().default("00000000-0000-0000-0000-000000000000"), //Empty UUID as not accommodate existing bookings.
    playerCount: int("playerCount").notNull().default(0),
    greenFeePerPlayers: int("greenFeePerPlayers").notNull().default(0),
    taxesPerPlayer: int("taxesPerPlayer").notNull().default(0),
    charityId: varchar("charityId", { length: 36 }),
    totalCharityAmount: int("totalCharityAmount").notNull().default(0),
    totalAmount: int("totalAmount").notNull().default(0),
    providerPaymentId: varchar("providerPaymentId", { length: 36 })
      .notNull()
      .default("00000000-0000-0000-0000-000000000000"),
    weatherQuoteId: varchar("weatherQuoteId", { length: 36 }),
    status:varchar("status", { length:10 }).notNull().default('RESERVED')
  },
  (table) => {
    return {
      listIdIdx: index("Booking_listId_idx").on(table.listId),
      ownerIdIdx: index("Booking_userId_idx").on(table.ownerId),
      unqBookingList: unique("Booking_listId_key").on(table.listId, table.id),
    };
  }
);

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  transfer: many(transfers),
  list: one(lists, {
    fields: [bookings.listId],
    references: [lists.id],
  }),
  user: one(users, {
    fields: [bookings.ownerId],
    references: [users.id],
  }),
  teeTime: one(teeTimes, {
    fields: [bookings.teeTimeId],
    references: [teeTimes.id],
  }),
  userBookingOffers: many(userBookingOffers),
}));

export type InsertBooking = InferInsertModel<typeof bookings>;

// import { relations } from "drizzle-orm";
// import { index, mysqlEnum, primaryKey, unique, varchar } from "drizzle-orm/mysql-core";
// import { mySqlTable } from "./_table";
// import { teeTimes } from "./teeTimes";
// import { userBookingOffers } from "./userBookingOffers";
// import { users } from "./users";

// export const userBookings = mySqlTable(
//   "userBookingTable",
//   {
//     id: varchar("id", { length: 36 }).notNull(),
//     role: mysqlEnum("role", ["OWNER", "PLAYER"]).notNull(),
//     userId: varchar("userId", { length: 191 }).notNull(),
//     teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
//   },
//   (table) => {
//     return {
//       teeTimeIdIdx: index("UserBookingTable_teeTimeId_idx").on(table.teeTimeId),
//       userBookingTableId: primaryKey(table.id),
//       userBookingTableUserIdTeeTimeIdKey: unique("UserBookingTable_userId_teeTimeId_key").on(
//         table.userId,
//         table.teeTimeId
//       ),
//     };
//   }
// );

// export const userBookingsRelations = relations(userBookings, ({ one, many }) => ({
//   user: one(users, {
//     fields: [userBookings.userId],
//     references: [users.id],
//   }),
//   teeTime: one(teeTimes, {
//     fields: [userBookings.teeTimeId],
//     references: [teeTimes.id],
//   }),
//   userBookingOffers: many(userBookingOffers),
// }));

import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, index, int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { bookings } from "./bookings";
import { courses } from "./courses";
import { users } from "./users";

export const transfers = mySqlTable(
  "transfer",
  {
    id: varchar("id", { length: 36 }).notNull(),
    amount: int("amount").notNull(),
    purchasedPrice: int("purchasedPrice").notNull().default(0),
    transactionId: varchar("transactionId", { length: 36 })
      .notNull()
      .default(sql`''`),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    bookingId: varchar("bookingId", { length: 36 }),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    fromUserId: varchar("fromUserId", { length: 36 }).notNull(),
    toUserId: varchar("toUserId", { length: 36 }).notNull(),
    fromBookingId: varchar("fromBookingId", { length: 36 }),
  },
  (table) => {
    return {
      bookingIdIdx: index("Transfer_bookingId_idx").on(table.bookingId),
      courseIdIdx: index("Transfer_courseId_idx").on(table.courseId),
      fromIdIdx: index("Transfer_fromUserId_idx").on(table.fromUserId),
      toIdIdx: index("Transfer_toUserId_idx").on(table.toUserId),
      transferId: primaryKey(table.id),
    };
  }
);

export const transfersRelations = relations(transfers, ({ one }) => ({
  course: one(courses, {
    fields: [transfers.courseId],
    references: [courses.id],
  }),
  fromUser: one(users, {
    fields: [transfers.fromUserId],
    references: [users.id],
    relationName: "TransferFromUser",
  }),
  toUser: one(users, {
    fields: [transfers.toUserId],
    references: [users.id],
    relationName: "TransferToUser",
  }),
  booking: one(bookings, {
    fields: [transfers.bookingId],
    references: [bookings.id],
  }),
}));

export type InsertTransfer = InferInsertModel<typeof transfers>;

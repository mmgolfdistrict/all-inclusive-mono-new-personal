import { relations, sql } from "drizzle-orm";
import { datetime, index, json, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { users } from "./users";

export const customerCarts = mySqlTable(
  "customerCart",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    userId: varchar("userId", { length: 36 }).notNull(),
    // courseId: varchar("courseId", { length: 36 }).notNull(),
    paymentId: varchar("paymentId", { length: 36 }).notNull(),
    teeTimeId: varchar("teeTimeId", { length: 36 }),
    listingId: varchar("listingId", { length: 36 }),
    cart: json("cart").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      paymentIdIdx: index("CustomerCart_paymentId_idx").on(table.paymentId),
      // courseUserIdIdx: index("CustomerCart_courseId_userId_idx").on(table.courseId, table.userId),
    };
  }
);

export const customerCartRelations = relations(customerCarts, ({ one }) => ({
  user: one(users, {
    fields: [customerCarts.userId],
    references: [users.id],
  }),
  // course: one(courses, {
  //   fields: [customerCarts.courseId],
  //   references: [courses.id],
  // }),
}));

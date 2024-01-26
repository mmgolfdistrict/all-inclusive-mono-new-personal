import { relations } from "drizzle-orm";
import { datetime, index, json, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { users } from "./users";

export const customerCarts = mySqlTable(
  "customerCart",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    userId: varchar("userId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    paymentId: varchar("paymentId", { length: 36 }).notNull(),
    cart: json("cart").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 }),
  },
  (table) => {
    return {
      paymentIdIdx: index("CustomerCart_paymentId_idx").on(table.paymentId),
      courseUserIdIdx: index("CustomerCart_courseId_userId_idx").on(table.courseId, table.userId),
    };
  }
);

export const customerCartRelations = relations(customerCarts, ({ one }) => ({
  user: one(users, {
    fields: [customerCarts.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [customerCarts.courseId],
    references: [courses.id],
  }),
}));

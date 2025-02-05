import { relations, sql } from "drizzle-orm";
import { datetime, index, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";

export const groupBookings = mySqlTable(
  "groupBooking",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    name: varchar("name", { length: 50 }).notNull(),
    providerPaymentId: varchar("providerPaymentId", { length: 36 }).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      providerPaymentIdIdx: index("providerPaymentId_idx").on(table.providerPaymentId),
    };
  }
);

export const customerCartRelations = relations(groupBookings, ({ one }) => ({
  course: one(courses, {
    fields: [groupBookings.courseId],
    references: [courses.id],
  }),
}));

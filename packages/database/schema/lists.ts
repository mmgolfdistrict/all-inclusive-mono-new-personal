import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, mysqlEnum, smallint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { bookings } from "./bookings";
import { courses } from "./courses";
import { teeTimes } from "./teeTimes";
import { users } from "./users";

export const lists = mySqlTable(
  "bookingListing",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    listPrice: int("listPrice").notNull(),
    endTime: datetime("endTime", { mode: "string", fsp: 3 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    status: mysqlEnum("status", ["PENDING", "ACCEPTED", "REJECTED"]).default("PENDING").notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    minimumOfferPrice: int("minimumOfferPrice").default(0).notNull(),
    splitTeeTime: boolean("splitTeeTime").default(false).notNull(),
    slots: smallint("slots").default(0).notNull(),
  },
  (table) => {
    return {
      courseIdIdx: index("List_courseId_idx").on(table.courseId),
      userIdIdx: index("List_userId_idx").on(table.userId),
      listPriceIdx: index("List_listPrice_idx").on(table.listPrice),
      courseIdIsDeletedIdx: index("List_courseId_isDeleted_idx").on(table.courseId, table.isDeleted),
    };
  }
);

export const listsRelations = relations(lists, ({ one, many }) => ({
  user: one(users, {
    fields: [lists.userId],
    references: [users.id],
  }),
  teeTime: one(teeTimes, {
    fields: [lists.teeTimeId],
    references: [teeTimes.id],
  }),
  booking: many(bookings),
  course: one(courses, {
    fields: [lists.courseId],
    references: [courses.id],
  }),
}));

export type InsertList = InferInsertModel<typeof lists>;

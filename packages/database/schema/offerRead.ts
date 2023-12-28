import { relations } from "drizzle-orm";
import { datetime, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { users } from "./users";

export const offerRead = mySqlTable(
  "offerRead",
  {
    userId: varchar("userId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    lastRead: datetime("lastRead", { mode: "string", fsp: 3 }),
  },
  (table) => {
    return {
      pKey: primaryKey(table.userId, table.courseId),
    };
  }
);

export const offerReadRelations = relations(offerRead, ({ one }) => ({
  user: one(users, {
    fields: [offerRead.userId],
    references: [users.id],
  }),
  course: one(courses, {
    fields: [offerRead.courseId],
    references: [courses.id],
  }),
}));

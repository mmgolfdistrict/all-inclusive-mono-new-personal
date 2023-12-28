import { InferInsertModel, relations } from "drizzle-orm";
import { int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { providers } from "./providers";
import { users } from "./users";

export const userProviderCourseLink = mySqlTable(
  "userProviderCourseLink",
  {
    userId: varchar("userId", { length: 36 }).notNull(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    customerId: int("customerId").notNull(),
    accountNumber: int("accountNumber").notNull(),
  },
  (table) => {
    return {
      pky: primaryKey({ columns: [table.userId, table.providerId] }),
    };
  }
);
relations(userProviderCourseLink, ({ one, many }) => ({
  user: one(users, {
    fields: [userProviderCourseLink.userId],
    references: [users.id],
  }),
  provider: one(providers, {
    fields: [userProviderCourseLink.providerId],
    references: [providers.id],
  }),
  course: one(courses, {
    fields: [userProviderCourseLink.courseId],
    references: [courses.id],
  }),
}));
export type InsertUserProviderCourseLink = InferInsertModel<typeof userProviderCourseLink>;

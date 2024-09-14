import type { InferInsertModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, int, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { providers } from "./providers";
import { users } from "./users";

export const userProviderCourseLink = mySqlTable(
  "userProviderCourseLink",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    userId: varchar("userId", { length: 36 }).notNull(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    customerId: int("customerId").notNull(),
    accountNumber: int("accountNumber").notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      // pky: primaryKey({ columns: [table.userId, table.providerId, table.id] }),
      uniqueUserCourseExternalID: unique("UK_user_id_course_id_customerId_account_number").on(
        table.userId,
        table.courseId,
        table.customerId,
        table.accountNumber
      ),
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

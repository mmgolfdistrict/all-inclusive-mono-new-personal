import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, primaryKey, text, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { providers } from "./providers";

// import { courseProviders } from './courseProviders';

export const providerCourseLink = mySqlTable(
  "providerCourseLink",
  {
    id: varchar("id", { length: 36 }).notNull(),
    // internalId: varchar("internalId", { length: 36 }).notNull().default("not-set"),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    providerCourseId: varchar("providerCourseId", { length: 36 }).notNull(),
    providerTeeSheetId: varchar("providerTeeSheetId", { length: 36 }).notNull(),
    lastIndex: datetime("lastIndex", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    providerCourseConfiguration: text("providerCourseConfiguration"),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    maxDaysToIndex: tinyint("maxDaysToIndex").default(1).notNull(),
  },
  (table) => {
    return {
      providerId: primaryKey(table.id),
    };
  }
);

export const providersRelations = relations(providerCourseLink, ({ one, many }) => ({
  courseProvider: one(courses, {
    fields: [providerCourseLink.courseId],
    references: [courses.id],
  }),
  providerId: one(providers, {
    fields: [providerCourseLink.providerId],
    references: [providers.id],
  }),
  // teeTimes: many(teeTimes),
}));

export type SelectProviders = InferSelectModel<typeof providers>;
export type InsertProviders = InferSelectModel<typeof providers>;

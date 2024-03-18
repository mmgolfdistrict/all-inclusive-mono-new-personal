import type { InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, primaryKey, text, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { providers } from "./providers";
import { teeTimes } from "./teeTimes";

// import { courseProviders } from './courseProviders';

export const providerCourseLink = mySqlTable(
  "providerCourseLink",
  {
    id: varchar("id", { length: 36 }).notNull(),
    internalId: varchar("internalId", { length: 36 }).notNull().default("not-set"),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    providerId: varchar("providerId", { length: 36 }).notNull(),
    providerCourseId: varchar("providerCourseId", { length: 36 }).notNull(),
    providerTeeSheetId: varchar("providerTeeSheetId", { length: 36 }).notNull(),
    lastIndex: datetime("lastIndex", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day0: datetime("day1", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day1: datetime("day1", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day2: datetime("day2", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day3: datetime("day3", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day4: datetime("day4", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day5: datetime("day5", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day6: datetime("day6", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day7: datetime("day7", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day8: datetime("day8", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day9: datetime("day9", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day10: datetime("day10", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day11: datetime("day11", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day12: datetime("day12", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day13: datetime("day13", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    day14: datetime("day14", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    providerCourseConfiguration: text("providerCourseConfiguration"),
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
  teeTimes: many(teeTimes),
}));

export type SelectProviders = InferSelectModel<typeof providers>;
export type InsertProviders = InferSelectModel<typeof providers>;

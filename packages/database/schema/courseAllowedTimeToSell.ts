import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { datetime, index, mysqlEnum, smallint, tinyint, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseAllowedTimeToSell = mySqlTable(
  "courseAllowedTimeToSell",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    day: mysqlEnum("day", ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]).notNull(),
    fromTime: smallint("fromTime").notNull(),
    toTime: smallint("toTime").notNull(),
    primaryMarketAllowedPlayers: tinyint("primaryMarketAllowedPlayers"),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  },
  (table) => {
    return {
      courseDayTimeUniqueConstraint: unique("course_day_time_unique_constraint").on(
        table.courseId,
        table.day,
        table.fromTime,
        table.toTime
      ),
      courseIdx: index("course_idx").on(table.courseId),
      dayIdx: index("day_idx").on(table.day),
    };
  }
);

export type InsertCourseAllowedTimeToSell = InferInsertModel<typeof courseAllowedTimeToSell>;
export type SelectCourseAllowedTimeToSell = InferSelectModel<typeof courseAllowedTimeToSell>;

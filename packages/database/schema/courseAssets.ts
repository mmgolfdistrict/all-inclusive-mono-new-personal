import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { assets } from "./assets";
import { courses } from "./courses";

export const courseAssets = mySqlTable(
  "courseAsset",
  {
    id: varchar("id", { length: 36 }).notNull(),
    order: int("order").notNull().default(0),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    assetId: varchar("assetId", { length: 36 }).notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdIdx: index("CourseAsset_courseId_idx").on(table.courseId),
      courseAssetId: primaryKey(table.id),
    };
  }
);
export const courseAssetsRelations = relations(courseAssets, ({ one }) => ({
  courseIds: one(courses, {
    fields: [courseAssets.courseId],
    references: [courses.id],
  }),
  assetIds: one(assets, {
    fields: [courseAssets.assetId],
    references: [assets.id],
  }),
}));

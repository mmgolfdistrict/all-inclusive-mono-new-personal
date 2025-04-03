import type { InferInsertModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { boolean, datetime, index, int, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const courseMerchandise = mySqlTable('courseMerchandise', {
  id: varchar('id', { length: 36 }).notNull().primaryKey(),
  courseId: varchar('courseId', { length: 36 }).notNull(),
  price: int('price').notNull().default(0),
  sku: varchar('sku', { length: 25 }).notNull(),
  caption: varchar('caption', { length: 50 }).notNull(),
  description: varchar('description', { length: 255 }),
  qoh: tinyint('qoh').notNull(),
  isActive: boolean('isActive').notNull().default(true),
  showDuringBooking: boolean('showDuringBooking').notNull().default(true),
  showOnlyIfBookingIsWithinXDays: tinyint('showOnlyIfBookingIsWithinXDays'),
  createdDateTime: datetime('createdDateTime', { mode: 'string', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
  lastUpdatedDateTime: datetime('lastUpdatedDateTime', { mode: 'string', fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
    .notNull(),
},
  (table) => ({
    courseIdIdx: index("CourseException_courseId_idx").on(table.courseId),
  })
);

export type InsertCourseMerchandise = InferInsertModel<typeof courseMerchandise>;

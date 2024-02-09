import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { promoCodes } from "./promoCodes";

export const coursePromoCodeLink = mySqlTable(
  "coursePromoCodeLink",
  {
    courseId: varchar("courseId", { length: 36 }).notNull(),
    promoCodeId: varchar("promoCodeId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      pky: primaryKey(table.courseId, table.promoCodeId),
    };
  }
);
export const coursePromoCodeLinkRelations = relations(coursePromoCodeLink, ({ one }) => ({
  course: one(courses, {
    fields: [coursePromoCodeLink.courseId],
    references: [courses.id],
  }),
  promoCode: one(promoCodes, {
    fields: [coursePromoCodeLink.promoCodeId],
    references: [promoCodes.id],
  }),
}));

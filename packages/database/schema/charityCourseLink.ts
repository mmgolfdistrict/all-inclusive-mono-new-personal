import { relations } from "drizzle-orm";
import { varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { charities } from "./charities";
import { courses } from "./courses";

export const charityCourseLink = mySqlTable("charity_course_link", {
  id: varchar("id", { length: 36 }).notNull().primaryKey(),
  charityId: varchar("charityId", { length: 36 }),
  courseId: varchar("courseId", { length: 36 }),
});

export const charityCourseLinkRelations = relations(charityCourseLink, ({ one }) => ({
  //add relations here
  courses: one(courses, {
    fields: [charityCourseLink.courseId],
    references: [courses.id],
  }),
  charity: one(charities, {
    fields: [charityCourseLink.charityId],
    references: [charities.id],
  }),
}));

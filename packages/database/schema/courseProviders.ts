// import { relations } from "drizzle-orm";
// import { index, primaryKey, varchar } from "drizzle-orm/mysql-core";
// import { mySqlTable } from "./_table";
// import { courses } from "./courses";
// import { providers } from "./providers";

// export const courseProviders = mySqlTable(
//   "courseProvider",
//   {
//     id: varchar("id", { length: 36 }).notNull(),
//     providerId: varchar("providerId", { length: 36 }).notNull(),
//     courseId: varchar("courseId", { length: 36 }).notNull(),
//   },
//   (table) => {
//     return {
//       entityProviderId: primaryKey(table.id),
//       providerIdIdx: index("CourseProvider_providerId_idx").on(table.providerId),
//       courseIdIdx: index("CourseProvider_courseId_idx").on(table.courseId),
//     };
//   }
// );
// export const courseProvidersRelations = relations(courseProviders, ({ one }) => ({
//   provider: one(providers, {
//     fields: [courseProviders.providerId],
//     references: [providers.id],
//   }),
//   course: one(courses, {
//     fields: [courseProviders.courseId],
//     references: [courses.id],
//   }),
// }));

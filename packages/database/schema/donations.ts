import { relations, sql } from "drizzle-orm";
import { datetime, int, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { charityCourseLink } from "./charityCourseLink";
import { users } from "./users";

export const donations = mySqlTable(`donation`, {
  id: varchar(`id`, { length: 36 }).notNull().primaryKey(),
  userId: varchar(`userId`, { length: 36 }),
  charityId: varchar(`charityId`, { length: 36 }),
  amount: int(`amount`),
  courseCharityId: varchar(`courseCharityId`, { length: 36 }),
  createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
    .default(sql`CURRENT_TIMESTAMP(3)`)
    .notNull(),
});

export const donationRelations = relations(donations, ({ one }) => ({
  courseCharity: one(charityCourseLink, {
    fields: [donations.courseCharityId],
    references: [charityCourseLink.id],
  }),
  user: one(users, {
    fields: [donations.userId],
    references: [users.id],
  }),
}));

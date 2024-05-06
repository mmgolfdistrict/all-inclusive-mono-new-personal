import type { InferInsertModel} from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { boolean, datetime, int, mysqlEnum, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { userBookingOffers } from "./userBookingOffers";
import { users } from "./users";

export const offers = mySqlTable(
  "offers",
  {
    id: varchar("id", { length: 36 }).notNull(),
    expiresAt: datetime("expiresAt", { mode: "string", fsp: 3 }).notNull(),
    price: int("price").notNull(),
    paymentIntentId: varchar("paymentIntentId", { length: 36 }).notNull(),
    //@TODO update this to to be inline with type
    createdAt: datetime("redeemsAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    status: mysqlEnum("status", ["PENDING", "ACCEPTED", "REJECTED"]).default("PENDING").notNull(),
    isDeclined: boolean("isDeclined").default(false).notNull(),
    isAccepted: boolean("isAccepted").default(false).notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
    buyerId: varchar("buyerId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      offerId: primaryKey(table.id),
    };
  }
);

export const offersRelations = relations(offers, ({ one, many }) => ({
  userBookingOffers: many(userBookingOffers),
  course: one(courses, {
    fields: [offers.courseId],
    references: [courses.id],
  }),
  user: one(users, {
    fields: [offers.buyerId],
    references: [users.id],
  }),
}));
export type InsertOffer = InferInsertModel<typeof offers>;

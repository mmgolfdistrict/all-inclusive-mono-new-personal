import { relations } from "drizzle-orm";
import { primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { promoCodes } from "./promoCodes";
import { users } from "./users";

export const userPromoCodeLink = mySqlTable(
  "userPromoCodeLink",
  {
    userId: varchar("userId", { length: 36 }).notNull(),
    promoCodeId: varchar("promoCodeId", { length: 36 }).notNull(),
  },
  (table) => {
    return {
      pky: primaryKey(table.userId, table.promoCodeId),
    };
  }
);
export const userPromoCodesLinkRelations = relations(userPromoCodeLink, ({ one }) => ({
  user: one(users, {
    fields: [userPromoCodeLink.userId],
    references: [users.id],
  }),
  promoCode: one(promoCodes, {
    fields: [userPromoCodeLink.promoCodeId],
    references: [promoCodes.id],
  }),
}));

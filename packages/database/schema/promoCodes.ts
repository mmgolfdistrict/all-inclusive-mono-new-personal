import { relations, sql } from "drizzle-orm";
import { boolean, datetime, index, int, mysqlEnum, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { coursePromoCodeLink } from "./coursePromoCodeLink";
import { userPromoCodeLink } from "./userPromoCodeLink";

export const promoCodes = mySqlTable(
  "promoCodes",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    code: varchar("code", { length: 36 }).notNull(),
    discount: int("discount").notNull(),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    maxRedemptionsPerUser: int("maxRedemptionsPerUser").notNull(),
    maxRedemptionsGlobal: int("maxRedemptionsGlobal").notNull(),
    discountType: mysqlEnum("discountType", ["PERCENTAGE", "AMOUNT"]).default("PERCENTAGE").notNull(),
    isGlobal: boolean("isGlobal").default(false).notNull(),
    startsAt: datetime("startsAt", { mode: "string", fsp: 3 }).notNull(),
    expiresAt: datetime("expiresAt", { mode: "string", fsp: 3 }).notNull(),
    isDeleted: boolean("isDeleted").default(false).notNull(),
  },
  (promoCodes) => {
    return {
      codeIndex: index("codeIndex").on(promoCodes.code),
    };
  }
);

export const promoCodesRelations = relations(promoCodes, ({ many }) => ({
  coursePromoCodeLink: many(coursePromoCodeLink),
  userPromoCodeLink: many(userPromoCodeLink),
}));

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  int,
  mysqlEnum,
  primaryKey,
  text,
  timestamp,
  tinyint,
  unique,
  varchar,
} from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { accounts } from "./accounts";
import { assets } from "./assets";
import { bids } from "./bids";
import { bookings } from "./bookings";
import { entityAdmins } from "./entityAdmins";
import { favorites } from "./favorites";
import { lists } from "./lists";
import { notifications } from "./notifications";
import { offerRead } from "./offerRead";
import { offers } from "./offers";
import { transfers } from "./transfers";
import { userWaitlists } from "./userWaitlists";

export const users = mySqlTable(
  "user",
  {
    id: varchar("id", { length: 36 }).notNull(),
    name: varchar("name", { length: 191 }),
    handle: varchar("handle", { length: 191 }),
    email: varchar("email", { length: 191 }).notNull(),
    emailVerified: timestamp("emailVerified", { mode: "string", fsp: 3 }),
    image: text("image"),
    gdImage: varchar("golfDistrictImage", { length: 191 }),
    // location: text("location"),
    createdAt: timestamp("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    updatedAt: timestamp("updatedAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastSuccessfulLogin: timestamp("lastSuccessfulLogin", {
      mode: "string",
      fsp: 3,
    }),
    balance: int("balance").default(0).notNull(),
    // address: text("address"),
    address1: text("address1"),
    address2: text("address2"),
    state: text("state"),
    city: text("city"),
    zipcode: text("zipcode"),
    country: text("country"),
    bannerImage: varchar("bannerImage", { length: 191 }),
    profileVisibility: mysqlEnum("profileVisibility", ["PUBLIC", "PRIVATE"]).default("PUBLIC").notNull(),
    gdPassword: varchar("gdPassword", { length: 191 }),
    processorId: varchar("processorId", { length: 191 }),
    updatedEmail: varchar("updatedEmail", { length: 191 }),
    secondFactor: varchar("secondFactor", { length: 191 }),
    forgotPasswordToken: varchar("forgotPasswordToken", { length: 191 }),
    forgotPasswordTokenExpiry: timestamp("forgotPasswordTokenExpiry", {
      mode: "string",
      fsp: 3,
    }),
    hyperswitchCustomerId: varchar("hyperswitchCustomerId", { length: 191 }),
    stripeConnectAccountId: varchar("stripeConnectAccountId", { length: 191 }),
    stripeConnectAccountStatus: mysqlEnum("stripeConnectAccountStatus", ["CONNECTED", "DISCONNECTED"])
      .default("DISCONNECTED")
      .notNull(),
    phoneNotifications: boolean("phoneNotifications").default(true).notNull(),
    phoneNumberCountryCode: tinyint("phoneNumberCountryCode").notNull(),
    phoneNumber: varchar("phoneNumber", { length: 25 }),
    phoneNumberVerified: timestamp("phoneNumberVerified", { mode: "string", fsp: 3 }),
    emailNotifications: boolean("emailNotifications").default(true).notNull(),
    verificationRequestToken: varchar("verificationRequestToken", {
      length: 191,
    }),
    verificationRequestExpiry: timestamp("verificationRequestExpiry", {
      mode: "string",
      fsp: 3,
    }),
    entityId: varchar("entityId", { length: 191 }),
    bannedUntilDateTime: timestamp("bannedUntilDateTime", {
      mode: "string",
      fsp: 3,
    }),
    allowDeleteCreditCard: boolean("allowDeleteCreditCard").default(false).notNull(),
  },
  (table) => {
    return {
      entityIdIdx: index("User_entityId_idx").on(table.entityId),
      idIdx: index("User_id_idx").on(table.id),
      userId: primaryKey(table.id),
      userEmailKey: unique("User_email_key").on(table.email),
      userHandleKey: unique("User_handle_key").on(table.handle),
    };
  }
);
export const usersRelations = relations(users, ({ one, many }) => ({
  accounts: many(accounts),
  administeredEntities: many(entityAdmins),
  favorites: many(favorites),
  bids: many(bids),
  notifications: many(notifications),
  offers: many(offers),
  booking: one(bookings),
  offerRead: many(offerRead),
  lists: many(lists),
  transfersReceived: many(transfers, {
    relationName: "TransferToUser",
  }),
  transfersSent: many(transfers, {
    relationName: "TransferFromUser",
  }),
  bannerImage: one(assets, {
    fields: [users.bannerImage],
    references: [assets.id],
  }),
  golfDistrictImage: one(assets, {
    fields: [users.gdImage],
    references: [assets.id],
  }),
  userWaitlists: many(userWaitlists),
}));
export type SelectUser = InferSelectModel<typeof users>;
export type InsertUser = InferInsertModel<typeof users>;

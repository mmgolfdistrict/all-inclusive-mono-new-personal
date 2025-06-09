import { datetime, tinyint, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { InferSelectModel, sql } from "drizzle-orm";


export const tempUser = mySqlTable("tempUser", {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    name: varchar("name", { length: 255 }),
    email: varchar("name", { length: 255 }),
    phoneNumberCountryCode: tinyint("phoneNumberCountryCode"),
    phoneNumber: varchar("phoneNumber", { length: 25 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3)`),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 }).notNull().default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
});

export type InsertCourseException = InferSelectModel<typeof tempUser>;
import type { InferSelectModel } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { bigint, boolean, datetime, unique, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";

export const foreupBookingPeople = mySqlTable(
  "foreupBookingPeople",
  {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    nid: bigint("nid", { mode: "number", unsigned: true }).notNull().autoincrement().unique(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    reservationId: varchar("reservationId", { length: 36 }).notNull(),
    foreupBookingId: varchar("foreupBookingId", { length: 36 }).notNull(),
    type: varchar("type", { length: 25 }),
    peopleId: varchar("peopleId", { length: 36 }).notNull(),
    attributes_first_name: varchar("attributes_first_name", { length: 50 }),
    attributes_last_name: varchar("attributes_last_name", { length: 50 }),
    attributes_formatted_name: varchar("attributes_formatted_name", { length: 127 }),
    attributes_phone_number: varchar("attributes_phone_number", { length: 25 }),
    attributes_phone_number_masked: varchar("attributes_phone_number_masked", { length: 25 }),
    attributes_cell_phone_number: varchar("attributes_cell_phone_number", { length: 25 }),
    attributes_cell_phone_number_masked: varchar("attributes_cell_phone_number_masked", { length: 25 }),
    attributes_email: varchar("attributes_email", { length: 127 }),
    attributes_birthday: varchar("attributes_birthday", { length: 25 }),
    attributes_address_1: varchar("attributes_address_1", { length: 50 }),
    attributes_address_2: varchar("attributes_address_2", { length: 25 }),
    attributes_city: varchar("attributes_city", { length: 50 }),
    attributes_state: varchar("attributes_state", { length: 25 }),
    attributes_zip: varchar("attributes_zip", { length: 25 }),
    attributes_country: varchar("attributes_country", { length: 50 }),
    attributes_comments: varchar("attributes_comments", { length: 2048 }),
    attributes_customer_username: varchar("attributes_customer_username", { length: 127 }),
    attributes_gender: varchar("attributes_gender", { length: 25 }),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      courseIdReservationIdpeopleIdUnique: unique(
        "foreupBookingPeople_CourseId_ReservationId_peopleId_Unique"
      ).on(table.courseId, table.reservationId, table.peopleId),
    };
  }
);

export type InsertForeUPBookingPeople = InferSelectModel<typeof foreupBookingPeople>;

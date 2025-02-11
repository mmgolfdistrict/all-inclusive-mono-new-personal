import { datetime, varchar, int } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { InferSelectModel, sql } from "drizzle-orm";

export const walkthroughSection = mySqlTable("walkthroughSection", {
    id: varchar("id", { length: 36 }).notNull().primaryKey(),
    walkthroughId: varchar("walkthroughId", { length: 36 }).notNull(),
    sectionId: varchar("sectionId", { length: 127 }).notNull(),
    message: varchar("message", { length: 512 }).notNull(),
    displayOrder: int("displayOrder"),
    createdDateTime: datetime("createdDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    lastUpdatedDateTime: datetime("lastUpdatedDateTime", { mode: "string", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)`),
  });
  
  export type InsertSystemNotification = InferSelectModel<typeof walkthroughSection>;
  
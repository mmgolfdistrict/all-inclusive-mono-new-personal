import type { InferInsertModel} from "drizzle-orm";
import { relations, sql } from "drizzle-orm";
import { datetime, index, primaryKey, varchar } from "drizzle-orm/mysql-core";
import { mySqlTable } from "./_table";
import { courses } from "./courses";
import { entities } from "./entities";
import { lists } from "./lists";
import { teeTimes } from "./teeTimes";
import { users } from "./users";

export const favorites = mySqlTable(
  "favorite",
  {
    id: varchar("id", { length: 36 }).notNull(),
    userId: varchar("userId", { length: 36 }).notNull(),
    teeTimeId: varchar("teeTimeId", { length: 36 }).notNull(),
    courseId: varchar("courseId", { length: 36 }).notNull(),
    entityId: varchar("entityId", { length: 36 }).notNull(),
    listId: varchar("listId", { length: 36 }),
    createdAt: datetime("createdAt", { mode: "string", fsp: 3 })
      .default(sql`CURRENT_TIMESTAMP(3)`)
      .notNull(),
  },
  (table) => {
    return {
      favoriteId: primaryKey(table.userId, table.teeTimeId),
      favoriteIdInx: index("Favorite_favoriteId_idx").on(table.id),
      courseIdIdx: index("Favorite_courseId_idx").on(table.courseId),
      entityIdIdx: index("Favorite_entityId_idx").on(table.entityId),
      teeTimeIdIdx: index("Favorite_teeTimeId_idx").on(table.teeTimeId),
      userIdIdx: index("Favorite_userId_idx").on(table.userId),
    };
  }
);

export const favoriteRelations = relations(favorites, ({ one }) => ({
  entity: one(entities, {
    fields: [favorites.entityId],
    references: [entities.id],
  }),
  course: one(courses, {
    fields: [favorites.courseId],
    references: [courses.id],
  }),
  listing: one(lists, {
    fields: [favorites.listId],
    references: [lists.id],
  }),
  teeTime: one(teeTimes, {
    fields: [favorites.teeTimeId],
    references: [teeTimes.id],
  }),
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
}));
export type InsertFavorite = InferInsertModel<typeof favorites>;

import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { schema } from "./schema";

export * from "drizzle-orm";
export { mySqlTable as tableCreator } from "./schema/_table";
export { schema };

export const db = drizzle(
  new Client({
    url: process.env.DATABASE_URL,
  }).connection(),
  { schema }
);

export type Db = typeof db;

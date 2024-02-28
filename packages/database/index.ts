import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { schema } from "./schema";

export * from "drizzle-orm";
export { mySqlTable as tableCreator } from "./schema/_table";
export { schema };

const client = new Client({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export type Db = typeof db;

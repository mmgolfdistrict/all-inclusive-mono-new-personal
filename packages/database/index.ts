import { Client } from "@planetscale/database";
import { drizzle } from "drizzle-orm/planetscale-serverless";
import { schema } from "./schema";

export * from "drizzle-orm";
export { mySqlTable as tableCreator } from "./schema/_table";
export { schema };

/*
const client = new Client({
  url: process.env.DATABASE_URL,
});

export const db = drizzle(client, { schema });

export type Db = typeof db;
*/
const primaryDatabaseClient = new Client({
  url: process.env.DATABASE_URL,
});
const secondaryDatabaseClient = new Client({
  url: process.env.SECONDARY_DATABASE_URL,
});

export const db = drizzle(primaryDatabaseClient, { schema, logger: false });

export const secondaryDb = drizzle(secondaryDatabaseClient, { schema, logger: false });

export type Db = typeof db;
export type SecondaryDb = typeof secondaryDb;

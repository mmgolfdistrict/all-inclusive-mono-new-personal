import * as dotenv from "dotenv";
import type { Config } from "drizzle-kit";

dotenv.config({
  path: "../../.env",
});

console.log("Database URL");
console.log(process.env.SECONDARY_DATABASE_URL);

if (!process.env.SECONDARY_DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default {
  schema: "./secondaryDbSchema",
  breakpoints: true,
  driver: "mysql2",
  dbCredentials: {
    uri: process.env.SECONDARY_DATABASE_URL!,
  },
} satisfies Config;

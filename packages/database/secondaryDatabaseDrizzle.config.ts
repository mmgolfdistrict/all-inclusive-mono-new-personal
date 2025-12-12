import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../.env",
});

console.log("Database URL");
console.log(process.env.SECONDARY_DATABASE_URL);

if (!process.env.SECONDARY_DATABASE_URL) {
  throw new Error("SECONDARY_DATABASE_URL is not set");
}

export default defineConfig({
  schema: "./secondaryDbSchema",
  breakpoints: true,
  dialect: "mysql",
  dbCredentials: {
    url: process.env.SECONDARY_DATABASE_URL!,
  },
});

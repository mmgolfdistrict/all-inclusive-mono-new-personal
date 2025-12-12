import * as dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config({
  path: "../../.env",
});

console.log("Database URL");
console.log(process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

export default defineConfig({
  schema: ["./schema", "./views"],
  breakpoints: true,
  dialect: "mysql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

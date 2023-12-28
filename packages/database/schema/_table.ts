import { mysqlTableCreator } from "drizzle-orm/mysql-core";

export const mySqlTable = mysqlTableCreator((name) => `golf_district_${name}`);

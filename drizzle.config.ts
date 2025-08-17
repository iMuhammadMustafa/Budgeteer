import type { Config } from "drizzle-kit";

export default {
  schema: "./src/types/db/sqllite/schema.ts",
  out: "./src/types/db/sqllite/drizzle",
  dialect: "sqlite",
  driver: "expo", // <--- very important
} satisfies Config;

import type { Config } from "drizzle-kit";

export default {
  schema: "./sqllite/schema.ts",
  out: "./sqllite/drizzle",
  dialect: "sqlite",
  driver: "expo", // <--- very important
} satisfies Config;

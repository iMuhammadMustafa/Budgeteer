import type { Config } from "drizzle-kit";

export default {
    schema: "./src/types/database/drizzle/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",
    driver: "expo",
} satisfies Config;

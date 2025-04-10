import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", // 'mysql' | 'sqlite' | 'turso'
  schema: "./src/models", // Path to your schema file // 'mysql2' | 'better-sqlite3' | 'turso'
  dbCredentials: {
    //@ts-ignore
    url: process.env.DATABASE_URL, // Your database connection string
  },
});

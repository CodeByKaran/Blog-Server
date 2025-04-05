import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import Logger from "../utils/logger"; // Optional logger

// Type for our database instance
export type DB = ReturnType<typeof drizzle>;

let db: DB;

/**
 * Connects to the Neon database and returns the Drizzle instance
 * @throws {Error} If connection fails
 */
export const connectDb = async (): Promise<DB> => {
  if (db) return db; // Return existing connection if available

  try {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Create Neon connection pool
    const sql = neon(process.env.DATABASE_URL);

    // Initialize Drizzle with schema
    db = drizzle({client: sql});

    Logger.info("✅ Database connected successfully");
    return db;
  } catch (error) {
    Logger.error("❌ Database connection failed:", error);
    throw error; // Re-throw for server startup handling
  }
};



/**
 * Get the active database instance
 * @throws {Error} If not connected
 */
export const getDB = (): DB => {
  if (!db) throw new Error("Database not connected. Call connectDB() first.");
  return db;
};
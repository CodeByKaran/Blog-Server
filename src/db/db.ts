import { drizzle } from "drizzle-orm/neon-http"; // this remains
import { neon } from "@neondatabase/serverless";
import { schema } from "../models/schema"; // this remains

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });

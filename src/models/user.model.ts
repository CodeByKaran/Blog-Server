import { relations } from "drizzle-orm";
import { pgTable as table } from "drizzle-orm/pg-core";
import * as t from "drizzle-orm/pg-core";
import { blogs } from "./blog.model";
import { saves } from "./saves.model";
import { likes } from "./likes.model";
import { comments } from "./comments.model";

export const users = table(
  "users",
  {
    id: t.uuid("id").primaryKey().notNull().defaultRandom(),
    first_name: t.varchar("first_name", { length: 30 }).notNull(),
    last_name: t.varchar("last_name", { length: 30 }).notNull(),
    bio: t.varchar("bio", { length: 200 }).default(""),
    username: t.varchar("username", { length: 30 }).notNull().unique(),
    email: t.text("email").notNull().unique(),
    image: t
      .text("image")
      .default("https://api.dicebear.com/9.x/personas/svg?seed=Brooklynn"),
    is_verified: t.boolean("is_verified").default(false).notNull(),
    password: t.text("password"),

    refresh_token: t.text("refresh_token"),
    provider: t.text("provider"),
    provider_id: t.text("provider_id"),
    otp: t.text("otp"),
    otp_expiry: t.timestamp("otp_expiry"), // 10 minutes from now
    created_at: t.timestamp("created_at").defaultNow().notNull(),
    updated_at: t.timestamp("updated_at").defaultNow().notNull(),
    deleted_at: t.timestamp("deleted_at"),
  },
  (table) => [
    t.uniqueIndex("email_idx").on(table.email),
    t.uniqueIndex("username_idx").on(table.username),
    t.uniqueIndex("user_id_idx").on(table.id),
    t.uniqueIndex("provider_id_idx").on(table.provider_id),
  ]
);

export type usersSchema = typeof users.$inferInsert;

export const userRealtions = relations(users, ({ many }) => ({
  blogs: many(blogs),
  saves: many(saves),
  likes: many(likes),
  comments: many(comments),
}));

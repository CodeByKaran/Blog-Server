import {
  pgTable,
  uniqueIndex,
  unique,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";
import { relations } from "drizzle-orm";
import { comments } from "./comments.model";
import { saves } from "./saves.model";
import { likes } from "./likes.model";

export const blogs = pgTable(
  "blogs",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 100 }).notNull(),
    description: varchar({ length: 300 }).notNull(),
    content: text().notNull(),
    images: text().array().default([""]).notNull(),
    tags: text().array().default([""]).notNull(),
    author_id: uuid("author_id").notNull(),
    created_at: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("blog_id_idx").using(
      "btree",
      table.id.asc().nullsLast().op("uuid_ops")
    ),
    index("tags_idx").using(
      "btree",
      table.tags.asc().nullsLast().op("array_ops")
    ),
    foreignKey({
      columns: [table.author_id],
      foreignColumns: [users.id],
      name: "blogs_author_id_users_id_fk",
    }),
  ]
);

export const blogsRelations = relations(blogs, ({ one, many }) => ({
  user: one(users, {
    fields: [blogs.author_id],
    references: [users.id],
  }),
  comments: many(comments),
  likes: many(likes),
  saves: many(saves),
}));

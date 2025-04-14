import {
  pgTable,
  uniqueIndex,
  unique,
  uuid,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";
import { blogs } from "./blog.model";
import { like, relations } from "drizzle-orm";

export const likes = pgTable(
  "likes",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    blogId: uuid("blog_id")
      .references(() => blogs.id, {
        onDelete: "cascade",
      })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, {
        onDelete: "cascade",
      })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("likes_blog_id_idx").using(
      "btree",
      table.blogId.asc().nullsLast().op("uuid_ops")
    ),
    index("likes_blog_user_idx").using(
      "btree",
      table.blogId.asc().nullsLast().op("uuid_ops"),
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    index("likes_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.blogId],
      foreignColumns: [blogs.id],
      name: "likes_blog_id_blogs_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "likes_user_id_users_id_fk",
    }).onDelete("cascade"),
    unique("unique_like").on(table.blogId, table.userId),
  ]
);

export type likesSchema = typeof likes.$inferInsert;

export const likesRelations = relations(likes, ({ one }) => ({
  blog: one(blogs, {
    fields: [likes.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
}));

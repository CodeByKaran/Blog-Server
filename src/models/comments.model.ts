import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";
import { blogs } from "./blog.model";
import { relations } from "drizzle-orm";

export const comments = pgTable(
  "comments",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    content: text().notNull(),
    blogId: uuid("blog_id")
      .references(() => blogs.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { mode: "string" })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp("deleted_at", { mode: "string" }),
  },
  (table) => [
    index("comments_blog_id_idx").using(
      "btree",
      table.blogId.asc().nullsLast().op("uuid_ops")
    ),
    index("comments_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.blogId],
      foreignColumns: [blogs.id],
      name: "comments_blog_id_blogs_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "comments_user_id_users_id_fk",
    }).onDelete("cascade"),
  ]
);

export const commentsRelations = relations(comments, ({ one }) => ({
  blog: one(blogs, {
    fields: [comments.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

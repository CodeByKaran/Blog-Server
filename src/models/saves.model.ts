import {
  pgTable,
  unique,
  uuid,
  timestamp,
  index,
  foreignKey,
} from "drizzle-orm/pg-core";
import { users } from "./user.model";
import { blogs } from "./blog.model";
import { relations } from "drizzle-orm";

export const saves = pgTable(
  "saves",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    blogId: uuid("blog_id").notNull(),
    userId: uuid("user_id").notNull(),
    createdAt: timestamp("created_at", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("saves_blog_id_idx").using(
      "btree",
      table.blogId.asc().nullsLast().op("uuid_ops")
    ),
    index("saves_user_id_idx").using(
      "btree",
      table.userId.asc().nullsLast().op("uuid_ops")
    ),
    foreignKey({
      columns: [table.blogId],
      foreignColumns: [blogs.id],
      name: "saves_blog_id_blogs_id_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: "saves_user_id_users_id_fk",
    }).onDelete("cascade"),
    unique("save_unique").on(table.blogId, table.userId),
  ]
);

export const savesRelations = relations(saves, ({ one }) => ({
  blog: one(blogs, {
    fields: [saves.blogId],
    references: [blogs.id],
  }),
  user: one(users, {
    fields: [saves.userId],
    references: [users.id],
  }),
}));

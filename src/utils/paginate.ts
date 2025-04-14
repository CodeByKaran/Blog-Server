import {
  and,
  arrayContains,
  eq,
  gt,
  inArray,
  lt,
  or,
  SQL,
  sql,
} from "drizzle-orm";
import { db } from "../db/db";
import { blogs } from "../models/blog.model";
import { table } from "console";
import { comments } from "../models/comments.model";
import { users } from "../models/user.model";

const formatDate = (dateObj: Date) => {
  // Format to match the PostgreSQL timestamp string format
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const day = String(dateObj.getDate()).padStart(2, "0");
  const hours = String(dateObj.getHours()).padStart(2, "0");
  const minutes = String(dateObj.getMinutes()).padStart(2, "0");
  const seconds = String(dateObj.getSeconds()).padStart(2, "0");
  const milliseconds = String(dateObj.getMilliseconds()).padStart(3, "0");

  // Format: 2025-04-11 12:22:00.212
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
  return formattedDate;
};

const paginateBlogs = async (
  cursor?: {
    id: string;
    created_at: Date;
  },
  pageSize = 3,
  orderBy: "asc" | "desc" = "desc",
  userId?: string
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      if (cursor) {
        const formattedDate = formatDate(cursor.created_at);
        return orderBy === "desc"
          ? or(
              lt(blogs.created_at, formattedDate),
              and(eq(blogs.created_at, formattedDate), lt(blogs.id, cursor.id))
            )
          : or(
              gt(blogs.created_at, formattedDate),
              and(eq(blogs.created_at, formattedDate), gt(blogs.id, cursor.id))
            );
      }

      return sql`TRUE`; // Ensure a valid SQL condition is always returned
    },
    orderBy: (blogs, { asc, desc }) =>
      orderBy === "asc"
        ? [asc(blogs.created_at), asc(blogs.id)]
        : [desc(blogs.created_at), desc(blogs.id)],
    limit: pageSize,
    with: {
      user: {
        columns: {
          username: true,
          image: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    extras: {
      totalLikes:
        sql<number>`CAST((SELECT COUNT(*) FROM likes WHERE blogs.id = likes.blog_id) AS INTEGER)`.as(
          "total_likes"
        ),
      totalSaves:
        sql<number>`CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)`.as(
          "total_saves"
        ),
      totalComments:
        sql<number>`CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)`.as(
          "total_comments"
        ),
      isLiked: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM likes
            WHERE likes.blog_id = blogs.id
            AND likes.user_id = ${userId}
          )`.as("is_liked")
        : sql<boolean>`false`.as("is_liked"),
      isSaved: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM saves 
            WHERE saves.blog_id = blogs.id 
            AND saves.user_id = ${userId}
          )`.as("is_saved")
        : sql<boolean>`false`.as("is_saved"),
    },
  });

  return result;
};

const paginateAuthorBlogs = async (
  authorId: string,
  pageSize = 5,
  userId?: string,
  cursor?: { id: string; created_at: Date }
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      const conditions = [];
      conditions.push(eq(blogs.author_id, authorId));
      if (cursor) {
        const formattedDate = formatDate(cursor.created_at);
        const cond = or(
          lt(blogs.created_at, formattedDate),
          and(eq(blogs.created_at, formattedDate), lt(blogs.id, cursor.id))
        );
        conditions.push(cond);
      }
      return and(...conditions);
    },
    orderBy: (blogs, { desc }) => [desc(blogs.created_at), desc(blogs.id)],
    limit: pageSize,
    with: {
      user: {
        columns: {
          username: true,
          image: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    extras: {
      totalLikes:
        sql<number>`CAST((SELECT COUNT(*) FROM likes WHERE blogs.id = likes.blog_id) AS INTEGER)`.as(
          "total_likes"
        ),
      totalSaves:
        sql<number>`CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)`.as(
          "total_saves"
        ),
      totalComments:
        sql<number>`CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)`.as(
          "total_comments"
        ),
      isLiked: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM likes
            WHERE likes.blog_id = blogs.id
            AND likes.user_id = ${userId}
          )`.as("is_liked")
        : sql<boolean>`false`.as("is_liked"),
      isSaved: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM saves 
            WHERE saves.blog_id = blogs.id 
            AND saves.user_id = ${userId}
          )`.as("is_saved")
        : sql<boolean>`false`.as("is_saved"),
    },
  });
  return result;
};

const paginateBlogsWithLikeTitle = async (
  title: string,
  pageSize = 3,
  userId?: string,
  cursor?: { id: string; created_at: Date }
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      const conditions = [];
      conditions.push(sql`LOWER(blogs.title) LIKE LOWER(${`%${title}%`})`);
      if (cursor) {
        const formattedDate = formatDate(cursor.created_at);
        conditions.push(
          or(
            lt(blogs.created_at, formattedDate),
            and(eq(blogs.created_at, formattedDate), lt(blogs.id, cursor.id))
          )
        );
      }
      return and(...conditions);
    },
    orderBy: (blogs, { desc }) => [desc(blogs.created_at), desc(blogs.id)],
    limit: pageSize,
    with: {
      user: {
        columns: {
          username: true,
          image: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    extras: {
      totalLikes:
        sql<number>`CAST((SELECT COUNT(*) FROM likes WHERE blogs.id = likes.blog_id) AS INTEGER)`.as(
          "total_likes"
        ),
      totalSaves:
        sql<number>`CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)`.as(
          "total_saves"
        ),
      totalComments:
        sql<number>`CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)`.as(
          "total_comments"
        ),
      isLiked: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM likes
            WHERE likes.blog_id = blogs.id
            AND likes.user_id = ${userId}
          )`.as("is_liked")
        : sql<boolean>`false`.as("is_liked"),
      isSaved: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM saves 
            WHERE saves.blog_id = blogs.id 
            AND saves.user_id = ${userId}
          )`.as("is_saved")
        : sql<boolean>`false`.as("is_saved"),
    },
  });
  return result;
};

// yaha se kl se krunga
const paginateBlogsWithMostLikes = async (
  pageSize = 3,
  userId?: string,
  cursor?: { id: string; created_at: Date }
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      if (!cursor) return undefined;
      else {
        const formatedDate = formatDate(cursor.created_at);
        return or(
          gt(blogs.created_at, formatedDate),
          and(eq(blogs.created_at, formatedDate), gt(blogs.id, cursor.id))
        );
      }
    },
    orderBy: (blogs) => [
      sql`(SELECT COUNT(*) FROM likes WHERE likes.blog_id = blogs.id) DESC`,
      blogs.id,
    ],
    limit: pageSize,
    with: {
      user: {
        columns: {
          username: true,
          image: true,
          first_name: true,
          last_name: true,
        },
      },
    },
    extras: {
      totalLikes:
        sql<number>`CAST((SELECT COUNT(*) FROM likes WHERE blogs.id = likes.blog_id) AS INTEGER)`.as(
          "total_likes"
        ),
      totalSaves:
        sql<number>`CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)`.as(
          "total_saves"
        ),
      totalComments:
        sql<number>`CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)`.as(
          "total_comments"
        ),
      isLiked: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM likes
            WHERE likes.blog_id = blogs.id
            AND likes.user_id = ${userId}
          )`.as("is_liked")
        : sql<boolean>`false`.as("is_liked"),
      isSaved: userId
        ? sql<boolean>`
          EXISTS (
            SELECT 1 FROM saves 
            WHERE saves.blog_id = blogs.id 
            AND saves.user_id = ${userId}
          )`.as("is_saved")
        : sql<boolean>`false`.as("is_saved"),
    },
  });
  return result;
};

const paginateBlogsWithMostSaves = async (
  pageSize = 3,
  cursor?: { id: string; totalSaves: number }
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      if (cursor) {
        return or(
          lt(
            sql`(SELECT COUNT(*) FROM saves WHERE saves.blog_id = blogs.id)`,
            cursor.totalSaves
          ),
          and(
            eq(
              sql`(SELECT COUNT(*) FROM saves WHERE saves.blog_id = blogs.id)`,
              cursor.totalSaves
            ),
            lt(blogs.id, cursor.id)
          )
        );
      }
      return undefined;
    },
    orderBy: (blogs) => [
      sql`(SELECT COUNT(*) FROM saves WHERE saves.blog_id = blogs.id) DESC`,
      blogs.id,
    ],
    limit: pageSize,
  });
  return result;
};

const paginateBlogsWithSameTags = async (
  tags: string[],
  pageSize = 3,
  cursor?: { id: string; created_at: Date }
) => {
  const result = await db.query.blogs.findMany({
    where: () => {
      const conditions = [];
      conditions.push(sql`EXISTS (
        SELECT 1 FROM blog_tags
        WHERE blog_tags.blog_id = blogs.id
        AND blog_tags.tag IN (${sql.join(tags)})
      )`);
      if (cursor) {
        const formattedDate = formatDate(cursor.created_at);
        conditions.push(
          or(
            lt(blogs.created_at, formattedDate),
            and(eq(blogs.created_at, formattedDate), lt(blogs.id, cursor.id))
          )
        );
      }
      return and(...conditions);
    },
    orderBy: (blogs, { desc }) => [desc(blogs.created_at), desc(blogs.id)],
    limit: pageSize,
  });
  return result;
};

const paginateUserwithLikeUsername = async (
  username: string,
  pageSize = 3,
  cursor?: { id: string }
) => {
  const result = await db.query.users.findMany({
    where: () => {
      const conditions = [
        sql`LOWER(users.username) LIKE LOWER(${`%${username}%`})`,
      ];
      if (cursor) {
        conditions.push(lt(users.id, cursor.id));
      }
      return and(...conditions);
    },
    orderBy: (users, { asc }) => [asc(users.id)],
    limit: pageSize,
  });
  return result;
};

const paginateCommetsOfBlogWithSameId = async (
  blogId: string,
  pageSize = 3,
  cursor?: { id: string; created_at: Date }
) => {
  const result = await db.query.comments.findMany({
    where: () => {
      const conditions = [];
      conditions.push(eq(comments.blogId, blogId));
      if (cursor) {
        const formattedDate = formatDate(cursor.created_at);
        conditions.push(
          or(
            lt(comments.createdAt, formattedDate),
            and(
              eq(comments.createdAt, formattedDate),
              lt(comments.id, cursor.id)
            )
          )
        );
      }
      return and(...conditions);
    },
    orderBy: (comments, { desc }) => [
      desc(comments.createdAt),
      desc(comments.id),
    ],
    limit: pageSize,
  });
  return result;
};

export {
  paginateBlogs,
  paginateAuthorBlogs,
  paginateBlogsWithLikeTitle,
  paginateBlogsWithMostLikes,
  paginateBlogsWithMostSaves,
  paginateBlogsWithSameTags,
  paginateCommetsOfBlogWithSameId,
  paginateUserwithLikeUsername,
};

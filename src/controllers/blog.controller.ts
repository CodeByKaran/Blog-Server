import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";
import { db } from "../db/db";
import { sql } from "drizzle-orm";

const paginateBlogs = async (
  cursor?: {
    id: string;
    created_at: Date;
  },
  pageSize = 3,
  orderBy: "asc" | "desc" = "asc",
  userId?: string
) => {
  const result = await db.query.blogs.findMany({
    where: (blogs, { gt, or, eq, and }) =>
      cursor
        ? or(
            gt(blogs.created_at, cursor.created_at.toISOString()),
            and(
              eq(blogs.created_at, cursor.created_at.toISOString()),
              gt(blogs.id, cursor.id)
            )
          )
        : undefined,
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
          "toatl_likes"
        ),
      totalSaves:
        sql<number>`CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)`.as(
          "toatl_saves"
        ),
      totalComments:
        sql<number>`CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)`.as(
          "toatl_comments"
        ),
      isLiked: sql<boolean>`
        EXISTS (
          SELECT 1 FROM likes
          WHERE likes.blog_id = blogs.id
          AND likes.user_id = ${userId}
        )`.as("is_liked"),
      isSaved: sql<boolean>`
       EXISTS (
         SELECT 1 FROM saves WHERE saves.blog_id = blogs.id AND saves.user_id = ${userId}
       )`.as("is_saved"),
    },
  });
  return result;
};

const getBlogs = AsyncHandler(async (req: Request, res: Response) => {
  //@ts-ignore
  const user = req.user;

  console.log(user.id);

  if (!user) {
    throw new ApiError(
      "unauthorized access, please signin first",
      HttpStatus.UNAUTHORIZED
    );
  }

  const id = req.query.id as string | undefined;
  const created_at = req.query.createdAt
    ? new Date(req.query.createdAt as string)
    : undefined;

  const pageSize = req.query.pageSize
    ? parseInt(req.query.pageSize as string, 10)
    : 5;

  const orderBy = req.query.orderBy as "asc" | "desc";

  let paginatedBlogs;

  if (id && created_at) {
    paginatedBlogs = await paginateBlogs(
      { id, created_at },
      pageSize,
      orderBy,
      user.id
    );
  } else {
    paginatedBlogs = await paginateBlogs(undefined, pageSize, orderBy, user.id);
  }

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        pageSize,
        orderBy,
        blogs: paginatedBlogs,
        cursor: paginatedBlogs.length
          ? {
              id: paginatedBlogs[paginatedBlogs.length - 1].id,
              created_at: paginatedBlogs[paginatedBlogs.length - 1].created_at,
            }
          : null,
      },
      "blogs retrived successfuly!"
    )
  );
});

export { getBlogs };

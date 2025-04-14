import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";
import { db } from "../db/db";
import { likes, likesSchema } from "../models/likes.model";
import { and, eq, sql } from "drizzle-orm";
import { isValidUUID } from "../utils/common.helper";
import { blogs } from "../models/blog.model";
import { users } from "../models/user.model";

const likeBlog = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Remove @ts-ignore with proper typing

  const blogId = req.params.blogId;

  // 1. Validate blogId format
  if (!isValidUUID(blogId)) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  // 2. Check if the blog exists
  const blogExists = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blogExists) {
    throw new ApiError("Blog not found", HttpStatus.NOT_FOUND);
  }

  // 3. Check if the user has already liked the blog
  const existingLike = await db
    .select()
    .from(likes)
    .where(and(eq(likes.blogId, blogId), eq(likes.userId, user.id)));

  if (existingLike.length > 0) {
    return res
      .status(HttpStatus.CONFLICT)
      .json(
        errorResponse("You've already liked this blog", HttpStatus.CONFLICT)
      );
  }

  // 4. Add the like to the database
  const newLike = await db
    .insert(likes)
    .values({
      blogId: blogId,
      userId: user.id,
    })
    .returning();

  console.log(newLike);

  // 5. Return success response
  return res
    .status(HttpStatus.CREATED)
    .json(successResponse({ like: newLike }, "Blog liked successfully"));
});

const unlikeBlog = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Remove @ts-ignore with proper typing
  const blogId = req.params.blogId;

  // 1. Enhanced Validation
  if (!isValidUUID(blogId)) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  // 2. Transaction with Full Error Handling
  const blogExists = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blogExists) {
    throw new ApiError("Blog not found", HttpStatus.NOT_FOUND);
  }

  const existingLike = await db.query.likes.findFirst({
    where: and(eq(likes.blogId, blogId), eq(likes.userId, user.id)),
  });

  if (!existingLike) {
    throw new ApiError(
      "You've already not liked this blog",
      HttpStatus.CONFLICT
    );
  }

  const deletedRes = await db
    .delete(likes)
    .where(and(eq(likes.blogId, blogId), eq(likes.userId, user.id)))
    .returning({ deletedId: likes.blogId });

  return res
    .status(HttpStatus.OK)
    .json(successResponse({ like: deletedRes }, "Blog unliked successfully"));
});

export { likeBlog, unlikeBlog };

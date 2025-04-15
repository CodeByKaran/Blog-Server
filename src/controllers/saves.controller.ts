import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";
import { db } from "../db/db";
import { saves } from "../models/saves.model";
import { blogs } from "../models/blog.model";
import { isValidUUID } from "../utils/common.helper";
import { and, eq } from "drizzle-orm";
import { paginateUserSavesBlogs } from "../utils/paginate";

// Save a blog
const saveBlog = AsyncHandler(async (req: Request, res: Response) => {
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

  // 3. Check if the blog is already saved by the user
  const existingSave = await db.query.saves.findFirst({
    where: and(eq(saves.blogId, blogId), eq(saves.userId, user.id)),
  });

  if (existingSave) {
    return res
      .status(HttpStatus.CONFLICT)
      .json(
        errorResponse("You've already saved this blog", HttpStatus.CONFLICT)
      );
  }

  // 4. Save the blog
  const newSave = await db
    .insert(saves)
    .values({
      blogId: blogId,
      userId: user.id,
    })
    .returning();

  // 5. Return success response
  return res
    .status(HttpStatus.CREATED)
    .json(successResponse({ save: newSave }, "Blog saved successfully"));
});

// Remove a saved blog
const removeBlog = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Remove @ts-ignore with proper typing
  const blogId = req.params.blogId;

  // 1. Validate blogId format
  if (!isValidUUID(blogId)) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  // 2. Check if the blog is saved by the user
  const existingSave = await db.query.saves.findFirst({
    where: and(eq(saves.blogId, blogId), eq(saves.userId, user.id)),
  });

  if (!existingSave) {
    throw new ApiError(
      "Blog not saved or not authorized",
      HttpStatus.NOT_FOUND
    );
  }

  // 3. Remove the saved blog
  const deletedSave = await db
    .delete(saves)
    .where(and(eq(saves.blogId, blogId), eq(saves.userId, user.id)))
    .returning();

  // 4. Return success response
  return res
    .status(HttpStatus.OK)
    .json(
      successResponse(
        { save: deletedSave },
        "Blog removed from saved successfully"
      )
    );
});

const getUserSavedBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  console.log("i runned");

  if (!user) {
    throw new ApiError("Unauthorized access", HttpStatus.UNAUTHORIZED);
  }

  const id = req.query.id as string | undefined;
  let created_at: Date | undefined = undefined;

  if (req.query.createdAt) {
    try {
      const dateString = req.query.createdAt as string;
      created_at = new Date(dateString);

      if (isNaN(created_at.getTime())) {
        throw new Error("Invalid date");
      }
    } catch (error) {
      throw new ApiError(
        "Invalid date format for createdAt",
        HttpStatus.BAD_REQUEST
      );
    }
  }

  const pageSize = req.query.pageSize
    ? parseInt(req.query.pageSize as string, 10)
    : 3;

  let paginatedBlogs;
  if (id && created_at) {
    paginatedBlogs = await paginateUserSavesBlogs(user.id, pageSize, {
      id,
      created_at,
    });
  } else {
    paginatedBlogs = await paginateUserSavesBlogs(user.id, pageSize);
  }

  const nextCursor =
    paginatedBlogs.length > 0
      ? {
          id: paginatedBlogs[paginatedBlogs.length - 1].id,
          createdAt: paginatedBlogs[paginatedBlogs.length - 1].createdAt,
        }
      : null;

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        pageSize,
        cursor: nextCursor,
        blogs: paginatedBlogs,
      },
      "Saved blogs retrieved successfully!"
    )
  );
});

export { saveBlog, removeBlog, getUserSavedBlogs };

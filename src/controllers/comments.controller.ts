import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";
import { db } from "../db/db";
import { comments } from "../models/comments.model";
import { blogs } from "../models/blog.model";
import { isValidUUID, removeExtraSpaces } from "../utils/common.helper";
import { and, eq } from "drizzle-orm";

// Post a comment on a blog
const postComment = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Remove @ts-ignore with proper typing
  const blogId = req.params.blogId;
  const { content } = req.body;

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

  const trimmedContent = removeExtraSpaces(content);

  // 3. Validate comment content
  if (!content || trimmedContent === "") {
    throw new ApiError(
      "Comment content cannot be empty",
      HttpStatus.BAD_REQUEST
    );
  }

  // 4. Add the comment to the database
  const newComment = await db
    .insert(comments)
    .values({
      blogId: blogId,
      userId: user.id,
      content: trimmedContent,
    })
    .returning();

  // 5. Return success response
  return res
    .status(HttpStatus.CREATED)
    .json(
      successResponse({ comment: newComment }, "Comment added successfully")
    );
});

const deleteComment = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user; // Ensure proper typing for req.user
  const commentId = req.params.commentId;

  // 1. Validate commentId format
  if (!isValidUUID(commentId)) {
    throw new ApiError("Invalid comment ID format", HttpStatus.BAD_REQUEST);
  }

  // 2. Check if the comment exists
  const comment = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
  });

  if (!comment) {
    throw new ApiError("Comment not found", HttpStatus.NOT_FOUND);
  }

  // 3. Verify if the user is authorized to delete the comment
  if (comment.userId !== user.id) {
    throw new ApiError(
      "You are not authorized to delete this comment",
      HttpStatus.FORBIDDEN
    );
  }

  // 4. Delete the comment from the database
  await db.delete(comments).where(eq(comments.id, commentId));

  // 5. Return success response
  return res
    .status(HttpStatus.OK)
    .json(successResponse({}, "Comment deleted successfully"));
});

export { postComment, deleteComment };

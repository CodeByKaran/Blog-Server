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
import { paginateCommetsOfBlogWithSameId } from "../utils/paginate";

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

const getCommentsOfBlogWithSameId = AsyncHandler(
  async (req: Request, res: Response) => {
    const { blogId } = req.params;

    if (
      !blogId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        blogId
      )
    ) {
      throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
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

    let paginatedComments;
    if (id && created_at) {
      paginatedComments = await paginateCommetsOfBlogWithSameId(
        blogId,
        pageSize,
        { id, created_at }
      );
    } else {
      paginatedComments = await paginateCommetsOfBlogWithSameId(
        blogId,
        pageSize
      );
    }

    const nextCursor =
      paginatedComments.length > 0
        ? {
            id: paginatedComments[paginatedComments.length - 1].id,
            created_at:
              paginatedComments[paginatedComments.length - 1].createdAt,
          }
        : null;

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          pageSize,
          cursor: nextCursor,
          comments: paginatedComments,
        },
        "Comments retrieved successfully!"
      )
    );
  }
);

export { postComment, deleteComment, getCommentsOfBlogWithSameId };

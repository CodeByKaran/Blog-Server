import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";
import { db } from "../db/db";
import { and, eq, sql } from "drizzle-orm";
import { blogPostSchema } from "../config/zod.schema";
import { blogs, blogsInsertion } from "../models/blog.model";
import {
  deleteMultipleImagesFromCloud,
  uploadImageToCloud,
  uploadMultipleImagesToCloud,
} from "../utils/cloudinary.upload";
import {
  removeExtraSpaces,
  removeExtraSpacesAndLowerCase,
} from "../utils/common.helper";
import {
  paginateAuthorBlogs,
  paginateBlogs,
  paginateBlogsWithLikeTitle,
  paginateBlogsWithSameTags,
} from "../utils/paginate";

// edit needed

const getBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req?.user;

  if (!user) {
    throw new ApiError(
      "unauthorized access, please signin first",
      HttpStatus.UNAUTHORIZED
    );
  }

  const id = req.query.id as string | undefined;

  let created_at: Date | undefined = undefined;

  if (req.query.createdAt) {
    try {
      // Handle the PostgreSQL timestamp format
      const dateString = req.query.createdAt as string;
      created_at = new Date(dateString);

      // Validate date
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
    : 5;

  const dire = (req.query.dire as "asc" | "desc") || "desc";

  const tags = req.query.tags as string[];
  const title = req.query.title as string;

  let paginatedBlogs;
  const totalBlogs = await db.$count(blogs);

  if (id && created_at) {
    paginatedBlogs = await paginateBlogs(
      { id, created_at },
      pageSize,
      dire,

      user.id
    );
  } else {
    paginatedBlogs = await paginateBlogs(
      undefined,
      pageSize,
      dire,

      user.id
    );
  }

  // Format cursor dates to match exactly how they appear in responses
  const nextCursor =
    paginatedBlogs.length > 0
      ? {
          id: paginatedBlogs[paginatedBlogs.length - 1].id,
          created_at: paginatedBlogs[paginatedBlogs.length - 1].created_at,
        }
      : null;

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        pageSize,
        cursor: nextCursor,
        totalBlogs,
        blogs: paginatedBlogs,
      },
      "blogs retrieved successfully!"
    )
  );
});

const checkSameTitle = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauhtorized access", HttpStatus.UNAUTHORIZED);
  }

  const { title, blogId } = req.params;

  if (
    !blogId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      blogId
    )
  ) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  const blog = await db.query.blogs.findFirst({
    where: and(eq(blogs.author_id, user.id), eq(blogs.id, blogId)),
  });

  if (!blog) {
    throw new ApiError(
      "blog doesn,t exit with provided id",
      HttpStatus.NOT_FOUND
    );
  }

  const normalizedTitle = removeExtraSpacesAndLowerCase(title);
  const dbNormalizedTitle = removeExtraSpacesAndLowerCase(blog?.title);

  if (normalizedTitle === dbNormalizedTitle) {
    return res
      .status(HttpStatus.BAD_REQUEST)
      .json(
        errorResponse(
          "blog with same title already exits",
          HttpStatus.BAD_REQUEST
        )
      );
  }

  return res
    .status(HttpStatus.OK)
    .json(successResponse({}, "title is unique", HttpStatus.OK));
});

const postBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauhtorized access!", HttpStatus.UNAUTHORIZED);
  }

  let imagesPath: string[] = [];
  let images: string[] = [];

  if (req.files) {
    const filesArray = Array.isArray(req.files) ? req.files : [req.files];
    filesArray.forEach((image: object) => {
      if (
        typeof image === "object" &&
        "path" in image &&
        typeof image.path === "string"
      ) {
        imagesPath.push(image.path);
      }
    });
  }

  if (imagesPath.length) {
    images = await uploadMultipleImagesToCloud(imagesPath);
  }

  const result = blogPostSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(result.error.errors[0].message, HttpStatus.BAD_REQUEST);
  }

  const { title, content, description, tags } = result.data;

  const blogData: blogsInsertion = {
    title: removeExtraSpaces(title),
    description: removeExtraSpaces(description),
    content: removeExtraSpaces(content),
    tags,
    images,
    author_id: user.id,
  };

  const newBlog = await db.insert(blogs).values(blogData).returning();

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        blog: newBlog,
      },
      "blog created successfully"
    )
  );
});

const deleteBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
  }

  const { blogId } = req.params;

  if (
    !blogId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      blogId
    )
  ) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
  });

  if (!blog) {
    throw new ApiError("blog not found with this id", HttpStatus.NOT_FOUND);
  }

  await deleteMultipleImagesFromCloud(blog.images);
  const result = await db.delete(blogs).where(eq(blogs.id, blogId));

  if (!result.rowCount) {
    throw new ApiError(
      "something went wrong while deleting blog,",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  return res
    .status(HttpStatus.OK)
    .json(successResponse({}, "blog deleted successfully"));
});

const updateBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
  }

  const { blogId } = req.params;

  if (
    !blogId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      blogId
    )
  ) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  // Find the blog to update
  const existingBlog = await db.query.blogs.findFirst({
    where: and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)),
  });

  if (!existingBlog) {
    throw new ApiError(
      "Blog not found or you don't have permission to update it",
      HttpStatus.NOT_FOUND
    );
  }

  // Validate request body fields
  const { title, content, description, tags } = req.body;

  // Create update object with only the fields that are present
  const updateData: Partial<blogsInsertion> = {};

  if (title !== undefined) {
    updateData.title = removeExtraSpaces(title);
  }

  if (description !== undefined) {
    updateData.description = removeExtraSpaces(description);
  }

  if (content !== undefined) {
    updateData.content = removeExtraSpaces(content);
  }

  if (tags !== undefined) {
    updateData.tags = tags;
  }

  // Check if there are any fields to update
  if (Object.keys(updateData).length === 0) {
    throw new ApiError(
      "No valid fields provided for update",
      HttpStatus.BAD_REQUEST
    );
  }

  // Update the blog
  const updatedBlog = await db
    .update(blogs)
    .set(updateData)
    .where(and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)))
    .returning();

  if (!updatedBlog.length) {
    throw new ApiError(
      "Something went wrong while updating the blog",
      HttpStatus.INTERNAL_SERVER_ERROR
    );
  }

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        blog: updatedBlog[0],
      },
      "Blog updated successfully"
    )
  );
});

const deleteSingleBlogImage = AsyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
    }

    const { blogId } = req.params;

    if (
      !blogId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        blogId
      )
    ) {
      throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
    }

    const { imageUrl } = req.body;

    if (!imageUrl) {
      throw new ApiError("imageUrl is required", HttpStatus.BAD_REQUEST);
    }

    // Find the blog
    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)),
    });

    if (!blog) {
      throw new ApiError(
        "Blog not found or you don't have permission to update it",
        HttpStatus.NOT_FOUND
      );
    }

    // Check if the image exists in the blog
    if (!blog.images.includes(imageUrl)) {
      throw new ApiError("Image not found in the blog", HttpStatus.BAD_REQUEST);
    }

    // Delete the image from Cloudinary
    try {
      await deleteMultipleImagesFromCloud([imageUrl]);
    } catch (error) {
      throw new ApiError(
        "Failed to delete image from cloud storage",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Remove the image URL from the blog's images array
    const updatedImages = blog.images.filter((img) => img !== imageUrl);

    // Update the blog with the new images array
    const updatedBlog = await db
      .update(blogs)
      .set({ images: updatedImages })
      .where(and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)))
      .returning();

    if (!updatedBlog.length) {
      throw new ApiError(
        "Something went wrong while updating the blog",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          blog: updatedBlog[0],
        },
        "Image deleted successfully from blog"
      )
    );
  }
);

const uploadSingleBlogImage = AsyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
      throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
    }

    const { blogId } = req.params;

    if (
      !blogId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        blogId
      )
    ) {
      throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
    }

    // Check if file exists in request
    if (!req.file) {
      throw new ApiError("No image file provided", HttpStatus.BAD_REQUEST);
    }

    // Find the blog
    const blog = await db.query.blogs.findFirst({
      where: and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)),
    });

    if (!blog) {
      throw new ApiError(
        "Blog not found or you don't have permission to update it",
        HttpStatus.NOT_FOUND
      );
    }

    if (blog.images.length >= 5) {
      throw new ApiError(
        "maximum five images are allowed",
        HttpStatus.BAD_REQUEST
      );
    }

    // Upload image to cloudinary
    let imageUrl: string;
    try {
      const result = await uploadImageToCloud(req.file.path);
      imageUrl = result.url;
    } catch (error) {
      throw new ApiError(
        "Failed to upload image to cloud storage",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    // Add new image URL to the blog's images array
    const updatedImages = [...blog.images, imageUrl];

    // Update the blog with the new images array
    const updatedBlog = await db
      .update(blogs)
      .set({ images: updatedImages })
      .where(and(eq(blogs.id, blogId), eq(blogs.author_id, user.id)))
      .returning();

    if (!updatedBlog.length) {
      throw new ApiError(
        "Something went wrong while updating the blog",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          blog: updatedBlog[0],
        },
        "Image uploaded successfully to blog"
      )
    );
  }
);

const getSingleBlog = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
  }

  const { blogId } = req.params;

  if (
    !blogId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      blogId
    )
  ) {
    throw new ApiError("Invalid blog ID format", HttpStatus.BAD_REQUEST);
  }

  const blog = await db.query.blogs.findFirst({
    where: eq(blogs.id, blogId),
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
      totalLikes: sql<number>`
        CAST((SELECT COUNT(*) FROM likes WHERE blogs.id = likes.blog_id) AS INTEGER)
      `.as("total_likes"),
      totalSaves: sql<number>`
        CAST((SELECT COUNT(*) FROM saves WHERE blogs.id = saves.blog_id) AS INTEGER)
      `.as("total_saves"),
      totalComments: sql<number>`
        CAST((SELECT COUNT(*) FROM comments WHERE blogs.id = comments.blog_id) AS INTEGER)
      `.as("total_comments"),
      isLiked: sql<boolean>`
        EXISTS (
          SELECT 1 FROM likes 
          WHERE likes.blog_id = blogs.id 
          AND likes.user_id = ${user.id}
        )
      `.as("is_liked"),
      isSaved: sql<boolean>`
        EXISTS (
          SELECT 1 FROM saves 
          WHERE saves.blog_id = blogs.id 
          AND saves.user_id = ${user.id}
        )
      `.as("is_saved"),
    },
  });

  if (!blog) {
    throw new ApiError("Blog not found", HttpStatus.NOT_FOUND);
  }

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        blog,
      },
      "Blog retrieved successfully"
    )
  );
});

const getAuthorBlogs = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("unauthorized access", HttpStatus.UNAUTHORIZED);
  }

  const { authorId } = req.params;

  if (
    !authorId ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      authorId
    )
  ) {
    throw new ApiError("Invalid author ID format", HttpStatus.BAD_REQUEST);
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
    : 5;

  const dire = (req.query.dire as "asc" | "desc") || "desc";

  let paginatedBlogs;
  const totalAuthorBlogs = await db.$count(
    blogs,
    eq(blogs.author_id, authorId)
  );

  if (id && created_at) {
    paginatedBlogs = await paginateAuthorBlogs(authorId, 2, user.id, {
      id,
      created_at,
    });
  } else {
    paginatedBlogs = await paginateAuthorBlogs(authorId, 2, user.id);
  }

  const nextCursor =
    paginatedBlogs.length > 0
      ? {
          id: paginatedBlogs[paginatedBlogs.length - 1].id,
          created_at: paginatedBlogs[paginatedBlogs.length - 1].created_at,
        }
      : null;

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        pageSize,
        cursor: nextCursor,
        totalBlogs: totalAuthorBlogs,
        blogs: paginatedBlogs,
      },
      "Author blogs retrieved successfully!"
    )
  );
});

const getBlogsWithSameTitle = AsyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    const title = req.query.title as string;

    if (!title) {
      throw new ApiError("title is required", HttpStatus.BAD_REQUEST);
    }

    const id = req.query.id as string;
    const string_date = req.query.createdAt as string;
    const created_at: Date = new Date(string_date);

    let paginatedResults;

    if (id && created_at) {
      paginatedResults = await paginateBlogsWithLikeTitle(title, 2, user.id, {
        id,
        created_at,
      });
    } else {
      paginatedResults = await paginateBlogsWithLikeTitle(title, 2, user.id);
    }

    const totalBlogs = await db.$count(
      blogs,
      sql`LOWER(blogs.title) LIKE LOWER(${`%${title}%`})`
    );

    const nextCursor =
      paginatedResults.length > 0
        ? {
            id: paginatedResults[paginatedResults.length - 1].id,
            created_at:
              paginatedResults[paginatedResults.length - 1].created_at,
          }
        : null;

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          pageSize: 2,
          totalBlogs,
          cursor: nextCursor,
          blogs: paginatedResults,
        },
        "blogs retrived successfully!"
      )
    );
  }
);

const getBlogsWithSameTags = AsyncHandler(
  async (req: Request, res: Response) => {
    const user = req.user;
    const tags = (req.query.tags as string)?.split(",") || [];

    if (!tags || tags.length === 0) {
      throw new ApiError("Tags are required", HttpStatus.BAD_REQUEST);
    }

    const id = req.query.id as string | undefined;
    const string_date = req.query.createdAt as string;
    const created_at: Date = new Date(string_date);

    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string, 10)
      : 2;

    let paginatedBlogs;
    if (id && created_at) {
      paginatedBlogs = await paginateBlogsWithSameTags(
        tags,
        pageSize,
        user.id,
        {
          id,
          created_at,
        }
      );
    } else {
      paginatedBlogs = await paginateBlogsWithSameTags(tags, pageSize, user.id);
    }

    const nextCursor =
      paginatedBlogs.length > 0
        ? {
            id: paginatedBlogs[paginatedBlogs.length - 1].id,
            created_at: paginatedBlogs[paginatedBlogs.length - 1].created_at,
          }
        : null;

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          pageSize,
          cursor: nextCursor,
          blogs: paginatedBlogs,
        },
        "Blogs retrieved successfully!"
      )
    );
  }
);

export {
  getBlogs,
  postBlogs,
  deleteBlogs,
  checkSameTitle,
  updateBlogs,
  deleteSingleBlogImage,
  uploadSingleBlogImage,
  getSingleBlog,
  getAuthorBlogs,
  getBlogsWithSameTitle,
  getBlogsWithSameTags,
};

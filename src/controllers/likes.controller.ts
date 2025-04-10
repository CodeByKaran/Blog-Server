import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import {
  ApiError,
  successResponse,
  errorResponse,
  HttpStatus,
} from "../utils/apiResponse";

const likeBlog = AsyncHandler(async (req: Request, res: Response) => {
  return res
    .status(HttpStatus.OK)
    .json(successResponse([], "Post liked successfully"));
});

export { likeBlog };

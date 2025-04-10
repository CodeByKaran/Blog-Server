import { NextFunction, Request, Response } from "express";
import { AsyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/apiResponse";
import jwt, { JwtPayload } from "jsonwebtoken";
import { verifyAccessToken } from "../utils/user.helper";
import Logger from "../utils/logger";

const AuthMiddleware = AsyncHandler(
  async (
    req: Request & { user?: JwtPayload; cookies: Record<string, string> },
    res: Response,
    next: NextFunction
  ) => {
    try {
      // Extract token from cookies or Authorization header
      const token =
        req.cookies?.access_token || req.headers.authorization?.split(" ")[1];

      if (!token) {
        throw new ApiError("Unauthorized access: Token not provided", 401);
      }

      // Verify the token
      const decoded = verifyAccessToken(token);

      // Attach user information to the request object
      req.user = decoded;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        console.log(jwt.TokenExpiredError);
      }

      throw new ApiError("Unauthorized access: Invalid token", 401);
    }
  }
);

export default AuthMiddleware;

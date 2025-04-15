import { AsyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiError, successResponse, HttpStatus } from "../utils/apiResponse";
import { signInSchema, signUpSchema } from "../config/zod.schema";
import { db } from "../db/db"; // Import the db instance
import {
  comparePassword,
  createUserInDatabase,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyRefreshToken,
} from "../utils/user.helper";
import { users, usersSchema } from "../models/user.model";
import { eventEmitter } from "../config/eventEmitter.config";
import { generateOTP } from "../utils/otp.helper";

import { eq } from "drizzle-orm";
import { uploadImageToCloud } from "../utils/cloudinary.upload";
import { paginateUserwithLikeUsername } from "../utils/paginate";

export const cokkiesOption = {
  httpOnly: true,
  secure: process.env.NODE_ENV !== "development",
};

export const cookiesConfig = {
  access: {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict" as const,
    maxAge: 12 * 60 * 60 * 1000,
  },
  refresh: {
    httpOnly: true,
    secure: process.env.NODE_ENV !== "development",
    sameSite: "strict" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    // Only sent to refresh endpoint
  },
};

const signUp = AsyncHandler(async (req: Request, res: Response) => {
  const result = signUpSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(result.error?.errors[0].message, HttpStatus.BAD_REQUEST);
  }

  // Check if user already exist
  const { email, password, first_name, last_name, username } = result.data;

  const existingUser = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email);
    },
  });

  if (existingUser) {
    throw new ApiError("User already exists", HttpStatus.BAD_REQUEST);
  }

  const hashedPassword = hashPassword(password);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

  const userData: usersSchema = {
    email,
    username,
    password: hashedPassword,
    first_name,
    last_name,
    is_verified: false,
    provider: "local",
    provider_id: null,
    otp,
    otp_expiry: otpExpiry,
  };

  await createUserInDatabase(userData);

  try {
    eventEmitter.emit("user.created", { email, username, otp });
    console.debug("Event emitted successfully");
  } catch (error) {
    console.error("Error emitting event:", error);
  }

  res.cookie("email", email);

  return res.status(HttpStatus.CREATED).json(
    successResponse({
      message: "User created successfully",
    })
  );
});

const verifyOtp = AsyncHandler(async (req: Request, res: Response) => {
  const { otp, email } = req.body;

  if (!email) {
    throw new ApiError("Email not found in cookies", HttpStatus.BAD_REQUEST);
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.eq(fields.email, email);
    },
  });

  if (!user) {
    throw new ApiError("User not found", HttpStatus.NOT_FOUND);
  }

  if (user?.is_verified) {
    throw new ApiError("User already verified", HttpStatus.BAD_REQUEST);
  }

  if (user.otp !== otp) {
    throw new ApiError("Invalid OTP", HttpStatus.BAD_REQUEST);
  }

  if (user.otp_expiry! < new Date()) {
    throw new ApiError("OTP expired", HttpStatus.BAD_REQUEST);
  }

  await db
    .update(users)
    .set({
      is_verified: true,
      otp: null,
      otp_expiry: null,
    })
    .where(eq(users.email, email));

  res.clearCookie("email", cokkiesOption);

  return res.status(HttpStatus.OK).json(
    successResponse({
      message: "OTP verified successfully",
    })
  );
});

const signIn = AsyncHandler(async (req: Request, res: Response) => {
  const result = signInSchema.safeParse(req.body);

  if (!result.success) {
    throw new ApiError(result.error?.errors[0].message, HttpStatus.BAD_REQUEST);
  }

  const user = await db.query.users.findFirst({
    where(fields, operators) {
      return operators.or(
        operators.eq(fields.email, result.data.email!),
        operators.eq(fields.username, result.data.username!)
      );
    },
  });

  if (!user) {
    throw new ApiError("User not found", HttpStatus.NOT_FOUND);
  }

  if (!user.is_verified) {
    throw new ApiError("User not verified", HttpStatus.UNAUTHORIZED);
  }

  const isValidPassword = comparePassword(result.data.password, user.password!);

  if (!isValidPassword) {
    throw new ApiError("Invalid password", HttpStatus.UNAUTHORIZED);
  }

  const access_token = generateAccessToken(user.id, user.image!, user.username);
  const refresh_token = generateRefreshToken(user.id);

  await db
    .update(users)
    .set({
      refresh_token,
    })
    .where(eq(users.id, user.id));

  res.cookie("refresh_token", refresh_token, cookiesConfig.refresh);
  res.cookie("access_token", access_token, cookiesConfig.access);

  const { email, id, first_name, image, last_name, username } = user;

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        email,
        id,
        first_name,
        image,
        last_name,
        username,
      },
      "User logged in successfully"
    )
  );
});

const refreshTokens = AsyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    throw new ApiError("Refresh token required", HttpStatus.UNAUTHORIZED);
  }

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Get user with current token version
    const user = await db.query.users.findFirst({
      where: eq(users.id, decoded.id),
    });

    if (!user) {
      throw new ApiError("Invalid refresh token", HttpStatus.UNAUTHORIZED);
    }

    const newRefreshToken = generateRefreshToken(user.id);

    await db
      .update(users)
      .set({
        refresh_token: newRefreshToken,
      })
      .where(eq(users.id, user.id));

    // Generate new tokens with updated version
    const newAccessToken = generateAccessToken(
      user.id,
      user.image!,
      user.username
    );

    // Set new cookies
    res.cookie("access_token", newAccessToken, cookiesConfig.access);
    res.cookie("refresh_token", newRefreshToken, cookiesConfig.refresh);

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          email: user.email,
          username: user.username,
          image: user.image,
        },
        "session refreshed"
      )
    );
  } catch (error) {
    throw new ApiError("Invalid refresh token", HttpStatus.UNAUTHORIZED);
  }
});

const getSessionUser = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("session has expired", HttpStatus.UNAUTHORIZED);
  }

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        user,
      },
      "user retrieved successfully"
    )
  );
});

const refreshOtp = AsyncHandler(async (req: Request, res: Response) => {
  const email = req.cookies.email!;

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    throw new ApiError("user not found", HttpStatus.UNAUTHORIZED);
  }

  if (user.is_verified) {
    throw new ApiError("user already verified", HttpStatus.UNAUTHORIZED);
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 15 * 60 * 1000);

  await db.update(users).set({
    otp,
    otp_expiry: otpExpiry,
  });

  try {
    eventEmitter.emit("otp.refreshed", { email, otp });
    console.debug("Event emitted successfully");
  } catch (error) {
    console.error("Error emitting event:", error);
  }

  return res.status(HttpStatus.OK).json(successResponse({}, "otp refreshed"));
});

const signOut = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("session is already destroyed!");
  }

  res.clearCookie("refresh_token", cookiesConfig.refresh);
  res.clearCookie("access_token", cookiesConfig.access);

  return res
    .status(HttpStatus.OK)
    .json(successResponse({}, "sign out successfully"));
});

const uploadProfileImage = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;
  const file = req.file?.path;

  if (!user) {
    throw new ApiError("unauthorize access", HttpStatus.UNAUTHORIZED);
  }

  if (!file) {
    throw new ApiError("file not provided", HttpStatus.NOT_FOUND);
  }

  const image = await uploadImageToCloud(file);

  const [uploadedImage] = await db
    .update(users)
    .set({
      image: image.url,
    })
    .returning({ id: users.id, image: users.image });

  return res
    .status(HttpStatus.CREATED)
    .json(
      successResponse(
        { image: uploadedImage },
        "profile image updated successfully"
      )
    );
});

const updateUserInfo = AsyncHandler(async (req: Request, res: Response) => {
  const user = req.user;

  if (!user) {
    throw new ApiError("Unauthorized - please login", HttpStatus.UNAUTHORIZED);
  }

  // Get updatable fields from request body
  const { first_name, last_name, username } = req.body;

  // Validate at least one field is being updated
  if (!first_name && !last_name && !username) {
    throw new ApiError("No fields provided for update", HttpStatus.BAD_REQUEST);
  }

  // Prepare update data
  const updateData: Partial<usersSchema> = {};
  if (first_name) updateData.first_name = first_name;
  if (last_name) updateData.last_name = last_name;
  if (username) updateData.username = username;

  // Update user in database
  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, user.id))
    .returning();

  return res.status(HttpStatus.OK).json(
    successResponse(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
      },
      "User updated successfully"
    )
  );
});

const getUsersWithLikeUsername = AsyncHandler(
  async (req: Request, res: Response) => {
    const username = req.query.username as string;

    if (!username) {
      throw new ApiError("Username is required", HttpStatus.BAD_REQUEST);
    }

    const id = req.query.id as string | undefined;
    const string_date = req.query.createdAt as string;
    const created_at: Date = new Date(string_date);
    const pageSize = req.query.pageSize
      ? parseInt(req.query.pageSize as string, 10)
      : 2;

    let paginatedUsers;
    if (id) {
      paginatedUsers = await paginateUserwithLikeUsername(username, pageSize, {
        id,
        created_at,
      });
    } else {
      paginatedUsers = await paginateUserwithLikeUsername(username, pageSize);
    }

    const nextCursor =
      paginatedUsers.length > 0
        ? {
            id: paginatedUsers[paginatedUsers.length - 1].id,
            createdAt: paginatedUsers[paginatedUsers.length - 1].created_at,
          }
        : null;

    return res.status(HttpStatus.OK).json(
      successResponse(
        {
          pageSize,
          cursor: nextCursor,
          users: paginatedUsers,
        },
        "Users retrieved successfully!"
      )
    );
  }
);

export {
  signUp,
  signIn,
  verifyOtp,
  refreshTokens,
  getSessionUser,
  refreshOtp,
  signOut,
  uploadProfileImage,
  updateUserInfo,
  getUsersWithLikeUsername,
};

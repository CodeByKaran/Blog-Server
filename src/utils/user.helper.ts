import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db/db";
import { users, usersSchema } from "../models/user.model";

/**
 * Hashes a password using bcrypt
 * @param password The plain text password to hash
 * @returns Promise containing the hashed password
 */
const hashPassword = (password: string): string => {
  // Use a higher cost factor for increased security (12-14 is recommended for production)
  const hashedPassword = bcrypt.hashSync(password, 12);
  return hashedPassword;
};

/**
 * Compares a password with its hashed version
 * @param password The plain text password to compare
 * @param hashedPassword The hashed password to compare against
 * @returns Promise containing boolean indicating if passwords match
 */
const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Generates a JWT access token
 * @param userId The user's unique identifier
 * @param image The user's profile image URL
 * @param username The user's username
 * @returns JWT access token
 */
const generateAccessToken = (
  userId: string,
  image: string, // Fixed typo: iamge → image
  username: string
): string => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign({ id: userId, image, username }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
};

/**
 * Generates a JWT refresh token
 * @param userId The user's unique identifier
 * @returns Promise containing JWT refresh token
 */
const generateRefreshToken = (userId: string): string => {
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_REFRESH_SECRET environment variable is not set");
  }

  // Note: jwt.sign is synchronous and doesn't need to be awaited
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!) as {
    id: string;
    username: string;
    image: string;
  };
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as {
    id: string;
  };
};

const createUserInDatabase = async (userData: usersSchema) => {
  const newUser = await db.insert(users).values(userData);
  return newUser;
};

export {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  createUserInDatabase,
};

import { title } from "process";
import { z } from "zod";

const signUpSchema = z.object({
  username: z
    .string()
    .min(6, "Username must contain at least 6 characters")
    .max(50, "Username cannot exceed 50 characters")
    .trim(),
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(50, "Password cannot exceed 50 characters"),
  first_name: z
    .string()
    .min(4, "First name must contain at least 4 characters")
    .max(50, "First name cannot exceed 50 characters")
    .trim(),
  last_name: z
    .string()
    .min(4, "Last name must contain at least 4 characters")
    .max(50, "Last name cannot exceed 50 characters")
    .trim(),
});

const signInSchema = z
  .object({
    username: z
      .string()
      .min(1, "Username must contain at least 1 character")
      .max(50, "Username cannot exceed 50 characters")
      .optional(),
    email: z.string().email("Please provide a valid email address").optional(),
    password: z
      .string()
      .min(8, "Password must contain at least 8 characters")
      .max(50, "Password cannot exceed 50 characters"),
  })
  .refine((data) => data.username || data.email, {
    message: "Either username or email must be provided",
    path: ["username", "email"],
  });

const blogPostSchema = z.object({
  title: z
    .string()
    .min(6, { message: "title must be minimum of 6 characters" })
    .max(50, "title cannot be more than 50 characters")
    .trim(),
  description: z
    .string()
    .min(20, { message: "description must be minimum of 20 characters" })
    .max(300, { message: "description cannot be more than 100 characters" })
    .trim(),
  content: z.string().nonempty("content must be provided").trim(),
  tags: z.array(
    z.string().min(2, { message: "Tag must be at least 2 characters" })
  ),
});

export { signUpSchema, signInSchema, blogPostSchema };

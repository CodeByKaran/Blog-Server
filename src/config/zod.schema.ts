import { z } from "zod";

const signUpSchema = z.object({
  username: z
    .string()
    .min(6, "Username must contain at least 6 characters")
    .max(50, "Username cannot exceed 50 characters"),
  email: z.string().email("Please provide a valid email address"),
  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(50, "Password cannot exceed 50 characters"),
  first_name: z
    .string()
    .min(4, "First name must contain at least 4 characters")
    .max(50, "First name cannot exceed 50 characters"),
  last_name: z
    .string()
    .min(4, "Last name must contain at least 4 characters")
    .max(50, "Last name cannot exceed 50 characters"),
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

export { signUpSchema, signInSchema };

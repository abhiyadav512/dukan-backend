const { z } = require("zod");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(16, "Password must not exceed 16 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(
    /[!@#$%^&*(),.?":{}|<>]/,
    "Password must contain at least one special character"
  );

const nameSchema = z
  .string()
  .min(20, "Name must be at least 20 characters")
  .max(60, "Name must not exceed 60 characters")
  .trim();

const addressSchema = z
  .string()
  .max(400, "Address must not exceed 400 characters")
  .trim();

const emailSchema = z.string().email("Invalid email format").toLowerCase();

const ratingSchema = z
  .number()
  .int("Rating must be an integer")
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must not exceed 5");

const userRegistrationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
});

const userLoginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const adminCreateUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  address: addressSchema,
  role: z.enum(["ADMIN", "USER", "STORE_OWNER"]).optional().default("USER"),
});

const storeCreationSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  address: addressSchema,
  ownerId: z.string()
});

const ratingSubmissionSchema = z.object({
  rating: ratingSchema,
  storeId: z.number().int().positive(),
});

const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

const storeSearchSchema = z.object({
  name: z.string().optional(),
  address: z.string().optional(),
  page: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(1)
  ),

  limit: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(10)
  ),
  sortBy: z.enum(["name", "address", "rating"]).optional().default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

const userListSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(["ADMIN", "USER", "STORE_OWNER"]).optional(),
  page: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(10)
  ),
  sortBy: z
    .enum(["name", "email", "address", "role"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

const storeListSchema = z.object({
  name: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  page: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(1)
  ),

  limit: z.preprocess(
    (val) => Number(val),
    z.number().int().positive().default(10)
  ),

  sortBy: z
    .enum(["name", "email", "address", "rating"])
    .optional()
    .default("name"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

module.exports = {
  userRegistrationSchema,
  userLoginSchema,
  adminCreateUserSchema,
  storeCreationSchema,
  ratingSubmissionSchema,
  passwordUpdateSchema,
  storeSearchSchema,
  userListSchema,
  storeListSchema,
};

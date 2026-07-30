import { z } from "zod";

// Standard Pagination Request & Meta Schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

export const PaginationMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().nonnegative()
});

export const ApiResponseMetaSchema = z.object({
  requestId: z.string().optional()
});

export const CreateListingRequestSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().min(2).max(4000).default("Detailed product listing on Omeetso"),
  priceInPaise: z.number().int().nonnegative(),
  negotiable: z.boolean().default(true),
  free: z.boolean().default(false),
  condition: z.string().default("good"),
  categoryId: z.string().min(1).default("mobiles"),
  subcategoryId: z.string().optional().default("mobiles"),
  images: z.array(z.string()).default([]),
  coverIndex: z.number().int().nonnegative().default(0),
  videoUrl: z.string().optional(),
  pincode: z.string().default("500081"),
  area: z.string().default("Madhapur"),
  city: z.string().default("Hyderabad"),
  fulfilment: z.string().default("pickup"),
  specs: z.record(z.string(), z.string()).default({}),
  contactPref: z.string().default("call_and_chat")
});

export const ListingSearchQuerySchema = PaginationQuerySchema.extend({
  q: z.string().optional(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  condition: z.string().optional(),
  city: z.string().optional().default("Hyderabad"),
  pincode: z.string().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc", "relevance"]).default("newest")
});

// Auth Request Schemas
export const RequestOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$|^\d{10}$/, "Valid 10-digit Indian phone required")
});

export const VerifyOtpSchema = z.object({
  phone: z.string().regex(/^\+91\d{10}$|^\d{10}$/),
  code: z.string().length(4, "4-digit OTP code required")
});

export const AdminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const AdminTwoFactorSchema = z.object({
  email: z.string().email(),
  code: z.string().min(6)
});

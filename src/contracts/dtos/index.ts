import { ListingStatus, StoreStatus, UserStatus } from "../enums";

export interface UserDto {
  id: string;
  phone: string;
  email?: string;
  accountType: "individual" | "business";
  status: UserStatus;
  profile: {
    name: string;
    avatar?: string;
    bio?: string;
    city: string;
    pincode: string;
    area?: string;
    language: string;
    memberSince: string;
  };
  verificationSummary: {
    mobileVerified: boolean;
    emailVerified: boolean;
    identityVerified: boolean;
    businessVerified: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ListingDto {
  id: string;
  sellerId: string;
  sellerName?: string;
  sellerAvatar?: string;
  storeId?: string;
  categoryId: string;
  subcategoryId: string;
  title: string;
  description: string;
  priceInPaise: number;
  negotiable: boolean;
  free: boolean;
  condition: string;
  images: string[];
  coverIndex: number;
  pincode: string;
  area: string;
  city: string;
  fulfilment: string;
  specs: Record<string, string>;
  contactPref: string;
  status: ListingStatus;
  publishedAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreDto {
  id: string;
  ownerId: string;
  name: string;
  tagline?: string;
  description: string;
  logo?: string;
  cover?: string;
  primaryCategory: string;
  pincode: string;
  area: string;
  city: string;
  status: StoreStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    fieldErrors?: Record<string, string>;
  };
  meta?: {
    requestId?: string;
  };
}

export interface PaginatedApiResponse<T = unknown> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

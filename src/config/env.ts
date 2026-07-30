import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const EnvSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PREFIX: z.string().default("/api/v1"),
  CLIENT_USER_URL: z.string().default("http://localhost:5173"),
  CLIENT_ADMIN_URL: z.string().default("http://localhost:5174"),
  MONGODB_URI: z.string().default("mongodb+srv://akhileshreddy066_db_user:s4Xzm5GRdB5b783C@cluster0.dzzxxm7.mongodb.net/?appName=Cluster0"),
  JWT_ACCESS_SECRET: z.string().min(16).default("omeetso_dev_access_secret_key_32_characters_minimum"),
  JWT_REFRESH_SECRET: z.string().min(16).default("omeetso_dev_refresh_secret_key_32_characters_minimum"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("30d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("90d"),
  CLOUDINARY_CLOUD_NAME: z.string().default("mock_cloud_name"),
  CLOUDINARY_API_KEY: z.string().default("mock_api_key"),
  CLOUDINARY_API_SECRET: z.string().default("mock_api_secret"),
  SMS_PROVIDER: z.string().default("mock")
});

export const env = EnvSchema.parse(process.env);

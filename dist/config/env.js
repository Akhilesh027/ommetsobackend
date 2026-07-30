"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const EnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().default(3000),
    NODE_ENV: zod_1.z.enum(["development", "test", "production"]).default("development"),
    API_PREFIX: zod_1.z.string().default("/api/v1"),
    CLIENT_USER_URL: zod_1.z.string().default("http://localhost:5173"),
    CLIENT_ADMIN_URL: zod_1.z.string().default("http://localhost:5174"),
    MONGODB_URI: zod_1.z.string().default("mongodb+srv://akhileshreddy066_db_user:s4Xzm5GRdB5b783C@cluster0.dzzxxm7.mongodb.net/?appName=Cluster0"),
    JWT_ACCESS_SECRET: zod_1.z.string().min(16).default("omeetso_dev_access_secret_key_32_characters_minimum"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(16).default("omeetso_dev_refresh_secret_key_32_characters_minimum"),
    JWT_ACCESS_EXPIRES_IN: zod_1.z.string().default("7d"),
    JWT_REFRESH_EXPIRES_IN: zod_1.z.string().default("7d"),
    CLOUDINARY_CLOUD_NAME: zod_1.z.string().default("mock_cloud_name"),
    CLOUDINARY_API_KEY: zod_1.z.string().default("mock_api_key"),
    CLOUDINARY_API_SECRET: zod_1.z.string().default("mock_api_secret"),
    SMS_PROVIDER: zod_1.z.string().default("mock")
});
exports.env = EnvSchema.parse(process.env);

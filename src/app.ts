import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import mongoose from "mongoose";
import { env } from "./config/env";
import { userAuthRouter } from "./modules/auth/routes/userAuth.routes";
import { adminAuthRouter } from "./modules/auth/routes/adminAuth.routes";
import { categoriesRouter } from "./modules/categories/routes/categories.routes";
import { uploadsRouter } from "./modules/uploads/routes/uploads.routes";
import { usersRouter } from "./modules/users/routes/users.routes";
import { listingsRouter } from "./modules/listings/routes/listings.routes";
import { adminListingsRouter } from "./modules/admin/routes/adminListings.routes";
import { storesRouter } from "./modules/stores/routes/stores.routes";
import { adminStoresRouter } from "./modules/admin/routes/adminStores.routes";
import { chatRouter } from "./modules/chat/routes/chat.routes";
import { notificationsRouter } from "./modules/notifications/routes/notifications.routes";
import { safetyRouter } from "./modules/safety/routes/safety.routes";
import { supportRouter } from "./modules/support/routes/support.routes";
import { verificationRouter } from "./modules/verification/routes/verification.routes";
import { revenueRouter } from "./modules/revenue/routes/revenue.routes";
import { adminDashboardRouter } from "./modules/admin/routes/adminDashboard.routes";
import { adminChatsRouter } from "./modules/admin/routes/adminChats.routes";

export const app: Express = express();

// Security & Core Middleware
app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

app.use(
  cors({
    origin: [env.CLIENT_USER_URL, env.CLIENT_ADMIN_URL, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  })
);

// Health Check Endpoints
app.get("/health", (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    status: isDbConnected ? "ok" : "degraded",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbConnected,
      host: mongoose.connection.host
    }
  });
});

app.get(`${env.API_PREFIX}/health`, (req: Request, res: Response) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(isDbConnected ? 200 : 503).json({
    success: isDbConnected,
    data: {
      status: isDbConnected ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  });
});

// API Routes
app.use(`${env.API_PREFIX}/auth`, userAuthRouter);
app.use(`${env.API_PREFIX}/admin/auth`, adminAuthRouter);
app.use(`${env.API_PREFIX}/categories`, categoriesRouter);
app.use(`${env.API_PREFIX}/uploads`, uploadsRouter);
app.use(`${env.API_PREFIX}/users`, usersRouter);
app.use(`${env.API_PREFIX}/listings`, listingsRouter);
app.use(`${env.API_PREFIX}/admin/listings`, adminListingsRouter);
app.use(`${env.API_PREFIX}/stores`, storesRouter);
app.use(`${env.API_PREFIX}/admin/stores`, adminStoresRouter);
app.use(`${env.API_PREFIX}/chat`, chatRouter);
app.use(`${env.API_PREFIX}/notifications`, notificationsRouter);
app.use(`${env.API_PREFIX}/safety`, safetyRouter);
app.use(`${env.API_PREFIX}/support`, supportRouter);
app.use(`${env.API_PREFIX}/verification`, verificationRouter);
app.use(`${env.API_PREFIX}/revenue`, revenueRouter);
app.use(env.API_PREFIX, revenueRouter);
app.use(`${env.API_PREFIX}/admin/dashboard`, adminDashboardRouter);
app.use(`${env.API_PREFIX}/admin/chats`, adminChatsRouter);

// Centralized 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.path} not found`
    }
  });
});

// Centralized Error Handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error(`[UnhandledError] ${req.method} ${req.path}:`, err);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
    }
  });
});

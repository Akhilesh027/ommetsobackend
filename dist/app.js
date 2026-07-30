"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./config/env");
const userAuth_routes_1 = require("./modules/auth/routes/userAuth.routes");
const adminAuth_routes_1 = require("./modules/auth/routes/adminAuth.routes");
const categories_routes_1 = require("./modules/categories/routes/categories.routes");
const uploads_routes_1 = require("./modules/uploads/routes/uploads.routes");
const users_routes_1 = require("./modules/users/routes/users.routes");
const listings_routes_1 = require("./modules/listings/routes/listings.routes");
const adminListings_routes_1 = require("./modules/admin/routes/adminListings.routes");
const stores_routes_1 = require("./modules/stores/routes/stores.routes");
const adminStores_routes_1 = require("./modules/admin/routes/adminStores.routes");
const chat_routes_1 = require("./modules/chat/routes/chat.routes");
const notifications_routes_1 = require("./modules/notifications/routes/notifications.routes");
const safety_routes_1 = require("./modules/safety/routes/safety.routes");
const support_routes_1 = require("./modules/support/routes/support.routes");
const verification_routes_1 = require("./modules/verification/routes/verification.routes");
const revenue_routes_1 = require("./modules/revenue/routes/revenue.routes");
const adminDashboard_routes_1 = require("./modules/admin/routes/adminDashboard.routes");
const adminChats_routes_1 = require("./modules/admin/routes/adminChats.routes");
exports.app = (0, express_1.default)();
// Security & Core Middleware
exports.app.use((0, helmet_1.default)());
exports.app.use((0, compression_1.default)());
exports.app.use((0, cookie_parser_1.default)());
exports.app.use(express_1.default.json({ limit: "10mb" }));
exports.app.use(express_1.default.urlencoded({ extended: true, limit: "10mb" }));
if (env_1.env.NODE_ENV !== "test") {
    exports.app.use((0, morgan_1.default)("dev"));
}
exports.app.use((0, cors_1.default)({
    origin: [env_1.env.CLIENT_USER_URL, env_1.env.CLIENT_ADMIN_URL, "http://localhost:5173", "http://localhost:5174"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
}));
// Health Check Endpoints
exports.app.get("/health", (req, res) => {
    const isDbConnected = mongoose_1.default.connection.readyState === 1;
    res.status(isDbConnected ? 200 : 503).json({
        status: isDbConnected ? "ok" : "degraded",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
            connected: isDbConnected,
            host: mongoose_1.default.connection.host
        }
    });
});
exports.app.get(`${env_1.env.API_PREFIX}/health`, (req, res) => {
    const isDbConnected = mongoose_1.default.connection.readyState === 1;
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
exports.app.use(`${env_1.env.API_PREFIX}/auth`, userAuth_routes_1.userAuthRouter);
exports.app.use(`${env_1.env.API_PREFIX}/admin/auth`, adminAuth_routes_1.adminAuthRouter);
exports.app.use(`${env_1.env.API_PREFIX}/categories`, categories_routes_1.categoriesRouter);
exports.app.use(`${env_1.env.API_PREFIX}/uploads`, uploads_routes_1.uploadsRouter);
exports.app.use(`${env_1.env.API_PREFIX}/users`, users_routes_1.usersRouter);
exports.app.use(`${env_1.env.API_PREFIX}/listings`, listings_routes_1.listingsRouter);
exports.app.use(`${env_1.env.API_PREFIX}/admin/listings`, adminListings_routes_1.adminListingsRouter);
exports.app.use(`${env_1.env.API_PREFIX}/stores`, stores_routes_1.storesRouter);
exports.app.use(`${env_1.env.API_PREFIX}/admin/stores`, adminStores_routes_1.adminStoresRouter);
exports.app.use(`${env_1.env.API_PREFIX}/chat`, chat_routes_1.chatRouter);
exports.app.use(`${env_1.env.API_PREFIX}/notifications`, notifications_routes_1.notificationsRouter);
exports.app.use(`${env_1.env.API_PREFIX}/safety`, safety_routes_1.safetyRouter);
exports.app.use(`${env_1.env.API_PREFIX}/support`, support_routes_1.supportRouter);
exports.app.use(`${env_1.env.API_PREFIX}/verification`, verification_routes_1.verificationRouter);
exports.app.use(`${env_1.env.API_PREFIX}/revenue`, revenue_routes_1.revenueRouter);
exports.app.use(env_1.env.API_PREFIX, revenue_routes_1.revenueRouter);
exports.app.use(`${env_1.env.API_PREFIX}/admin/dashboard`, adminDashboard_routes_1.adminDashboardRouter);
exports.app.use(`${env_1.env.API_PREFIX}/admin/chats`, adminChats_routes_1.adminChatsRouter);
// Centralized 404 Handler
exports.app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: `Route ${req.method} ${req.path} not found`
        }
    });
});
// Centralized Error Handler
exports.app.use((err, req, res, _next) => {
    console.error(`[UnhandledError] ${req.method} ${req.path}:`, err);
    res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            message: env_1.env.NODE_ENV === "production" ? "An unexpected error occurred" : err.message
        }
    });
});

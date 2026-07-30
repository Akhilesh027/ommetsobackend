"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
const http_1 = __importDefault(require("http"));
const app_1 = require("./app");
const env_1 = require("./config/env");
const connect_1 = require("./database/connect");
const adminSeeder_1 = require("./database/seeders/adminSeeder");
const categorySeeder_1 = require("./database/seeders/categorySeeder");
const adSeeder_1 = require("./database/seeders/adSeeder");
const socket_server_1 = require("./sockets/socket-server");
const cleanupWorker_1 = require("./jobs/cleanupWorker");
const server = http_1.default.createServer(app_1.app);
// Initialize Socket.IO engine
exports.io = (0, socket_server_1.initSocketServer)(server);
async function startServer() {
    await (0, connect_1.connectDatabase)();
    await (0, adminSeeder_1.seedAdminUsers)();
    await (0, categorySeeder_1.seedCategories)();
    await (0, adSeeder_1.seedAdConfiguration)();
    (0, cleanupWorker_1.startBackgroundWorkers)();
    server.listen(env_1.env.PORT, () => {
        console.log(`[Server] Omeetso Modular Monolith Backend listening on port ${env_1.env.PORT} (${env_1.env.NODE_ENV})`);
        console.log(`[Server] Health check available at: http://localhost:${env_1.env.PORT}/health`);
        console.log(`[Socket.IO] Real-Time Gateway initialized`);
    });
}
// Graceful Shutdown
async function shutdown(signal) {
    console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
    server.close(async () => {
        console.log("[Server] HTTP server closed");
        await (0, connect_1.disconnectDatabase)();
        process.exit(0);
    });
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
startServer().catch((err) => {
    console.error("[Server] Fatal error during startup:", err);
    process.exit(1);
});

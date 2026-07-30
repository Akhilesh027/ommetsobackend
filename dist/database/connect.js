"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("../config/env");
async function connectDatabase() {
    try {
        mongoose_1.default.set("strictQuery", true);
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI);
        console.log(`[MongoDB] Successfully connected to database: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    }
    catch (error) {
        console.error("[MongoDB] Connection failure:", error);
        process.exit(1);
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    console.log("[MongoDB] Disconnected");
}

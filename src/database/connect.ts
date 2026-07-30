import mongoose from "mongoose";
import { env } from "../config/env";

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(env.MONGODB_URI);
    console.log(`[MongoDB] Successfully connected to database: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error("[MongoDB] Connection failure:", error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log("[MongoDB] Disconnected");
}

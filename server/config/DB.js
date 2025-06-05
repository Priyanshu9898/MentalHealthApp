import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * Establishes a connection to MongoDB using Mongoose.
 * - Validates the presence of MONGODB_URI in environment variables.
 * - Applies recommended connection options.
 * - Listens for connection events (connected, error, disconnected).
 * - Handles process termination gracefully.
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "❌ MongoDB connection error: MONGODB_URI is not defined in environment variables."
    );
    process.exit(1);
  }

  const options = {};

  try {
    await mongoose.connect(uri, options);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }

  // Connection event listeners
  mongoose.connection.on("connected", () => {
    console.log("🌐 Mongoose default connection open");
  });

  mongoose.connection.on("error", (err) => {
    console.error("❌ Mongoose default connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ Mongoose default connection disconnected");
  });

  // Graceful shutdown
  const gracefulExit = (signal) => {
    console.info(`🛑 Received ${signal}. Closing MongoDB connection…`);
    mongoose.connection.close(false, () => {
      console.log("🟢 MongoDB connection closed. Exiting process.");
      process.exit(0);
    });
  };

  process.on("SIGINT", () => gracefulExit("SIGINT")); // Ctrl+C
  process.on("SIGTERM", () => gracefulExit("SIGTERM"));
};

export default connectDB;

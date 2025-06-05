// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.js";
import connectDB from "./config/DB.js";

// Load environment variables from .env file
dotenv.config();

const app = express();

const { PORT, NODE_ENV } = process.env;

if (!PORT) {
  console.error("❌ PORT is not defined in environment variables.");
  process.exit(1);
}

// Connect to MongoDB
connectDB()
  .then(() => {
    console.log("✅ Database connection established");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
    process.exit(1);
  });

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Mount route handlers
app.use("/api/auth", authRoutes);

// Health-check endpoint
app.get("/", (req, res) => {
  res.status(200).send("🚀 API is running");
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: "❓ Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled error:", err);
  res.status(500).json({ message: "Internal Server Error" });
});

// Start the server
app.listen(PORT, () => {
  console.log(
    `🚀 Server listening on port ${PORT} in ${NODE_ENV || "development"} mode`
  );
});

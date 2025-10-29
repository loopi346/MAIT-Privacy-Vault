"use strict";

/**
 * Privacy Vault - Minimal Express Server
 * ------------------------------------------------------------
 * Purpose:
 *   - Provide a clean, well-documented starting point for a Node.js
 *     service that will host Privacy Vault APIs.
 *   - Demonstrate separation of concerns by keeping routing logic
 *     out of the main server initialization flow.
 *
 * How this file is organized:
 *   1) Module imports and app initialization
 *   2) Global middleware configuration
 *   3) Route mounting on the app (router kept separate in routes/anonymize.js)
 *   4) Server startup
 */

// 1) Module imports and app initialization --------------------
// Express is the minimalist web framework we use to declare HTTP routes.
// dotenv loads environment variables from a local env file into process.env.
const express = require("express");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Prefer cedula.env if present; otherwise fallback to .env
const cedulaEnvPath = path.join(process.cwd(), "cedula.env");
const defaultEnvPath = path.join(process.cwd(), ".env");
if (fs.existsSync(cedulaEnvPath)) {
  dotenv.config({ path: cedulaEnvPath });
} else {
  dotenv.config({ path: defaultEnvPath });
}

const { connectMongo } = require("./db/mongo");

// Create a single Express application instance for our service.
// Keep this file focused on wiring, not business logic.
const app = express();

// Define the port. Prefer environment variable when available, else default.
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// 2) Global middleware configuration -------------------------
// Parse incoming requests with JSON payloads so req.body is available as an object.
// Add more global middleware here (CORS, logging, security headers) when needed.
app.use(express.json());
// Serve a minimal frontend from the /public directory.
app.use(express.static("public"));

// 3) Route mounting on the app -------------------------------
// Mount all anonymization endpoints under the /anonymize prefix.
// Route modules hide transport details and keep this file small.
const anonymizeRouter = require("./routes/anonymize");
const healthRouter = require("./routes/health");
const aiRouter = require("./routes/ai");
app.use("/anonymize", anonymizeRouter);
app.use("/health", healthRouter);
app.use("/ai", aiRouter);

// 4) Server startup ------------------------------------------
// Start HTTP server immediately. Attempt DB connection in background.
app.listen(PORT, () => {
  console.log(`Privacy Vault API is running on http://localhost:${PORT}`);
});

const uri = process.env.MONGODB_URI;
connectMongo(uri)
  .then(() => {
    console.log("MongoDB connected.");
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });

// Export the app instance for potential future testing or integration.
module.exports = app;




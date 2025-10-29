"use strict";

/**
 * db/mongo.js
 * ------------------------------------------------------------
 * Centralized MongoDB connection using Mongoose. Import and call
 * connectMongo() once during server startup.
 */

const mongoose = require("mongoose");

async function connectMongo(uri) {
  if (!uri || typeof uri !== "string") {
    throw new Error("MONGODB_URI is missing or invalid. Provide a valid connection string.");
  }

  // Avoid creating multiple connections in dev hot-reload scenarios.
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Recommended flags for strict querying and to avoid silent buffering
  // when DB is unavailable.
  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  await mongoose.connect(uri);
  return mongoose.connection;
}

module.exports = { connectMongo };



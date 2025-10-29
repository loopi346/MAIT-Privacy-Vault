"use strict";

/**
 * routes/health.js
 * ------------------------------------------------------------
 * Lightweight health check endpoint.
 * Returns HTTP server status and current MongoDB connection status.
 */

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection && mongoose.connection.readyState;
  const db = dbState === 1 ? "connected" : dbState === 2 ? "connecting" : "disconnected";
  return res.status(200).json({ http: "ok", db });
});

module.exports = router;



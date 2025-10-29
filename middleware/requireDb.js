"use strict";

/**
 * middleware/requireDb.js
 * ------------------------------------------------------------
 * Ensures MongoDB is connected before handling DB-dependent routes.
 * If not connected, responds with 503 Service Unavailable.
 */

const mongoose = require("mongoose");

function requireDb(req, res, next) {
  const isConnected = mongoose.connection && mongoose.connection.readyState === 1;
  if (!isConnected) {
    return res.status(503).json({
      error: "Service unavailable: database not connected",
      code: "DB_NOT_CONNECTED",
    });
  }
  return next();
}

module.exports = { requireDb };



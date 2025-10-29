"use strict";

/**
 * routes/anonymize.js
 * ------------------------------------------------------------
 * Encapsulates endpoints related to anonymization so that server wiring
 * remains clean and focused. This module exports an Express Router.
 *
 * Layering:
 *   - Router: declares HTTP method + path and composes middleware
 *   - Middleware: validates/transforms input (see middleware/validateCedula)
 *   - Controller: performs the business action (see controllers/anonymizeController)
 */

const express = require("express");
const { validateCedula } = require("../middleware/validateCedula");
const { requireDb } = require("../middleware/requireDb");
const { acknowledgeCedula, anonymizeCedula } = require("../controllers/anonymizeController");

// Create a dedicated Router for anonymization endpoints.
// Add more routes here as the API grows (e.g., /email, /phone, etc.).
const router = express.Router();

/**
 * POST /anonymize/cedula
 * ------------------------------------------------------------
 * Accepts a JSON payload and validates the presence of a cédula string.
 * For now, the route acknowledges the request. Future versions can
 * implement format checks, hashing, tokenization, and auditing here.
 *
 * Expected body:
 *   { "cedula": "string" }
 */
router.post("/cedula", validateCedula, acknowledgeCedula);

/**
 * POST /anonymize/cedula/anonymize
 * Applies anonymization strategy and persists a record in MongoDB.
 */
router.post("/cedula/anonymize", validateCedula, requireDb, anonymizeCedula);

module.exports = router;



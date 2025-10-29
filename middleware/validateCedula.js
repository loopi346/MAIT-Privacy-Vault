"use strict";

/**
 * middleware/validateCedula.js
 * ------------------------------------------------------------
 * Express middleware that validates the shape and format of a cédula.
 * Keeps validation concerns separate from routing and business logic.
 */

/**
 * validateCedula
 * Ensures req.body has a non-empty string 'cedula' that matches a
 * configurable basic policy (digits-only, length between 6 and 12).
 * Adjust the rules as needed for your jurisdiction.
 *
 * On success:
 *   - attaches req.validatedCedula (normalized string)
 *   - calls next()
 * On failure:
 *   - responds 400 with an error and short code
 */
function validateCedula(req, res, next) {
  const { cedula } = req.body || {};

  if (typeof cedula !== "string" || cedula.trim().length === 0) {
    return res.status(400).json({
      error: "Invalid input: 'cedula' is required and must be a non-empty string.",
      code: "CEDULA_REQUIRED",
    });
  }

  const trimmed = cedula.trim();
  const digitsOnly = /^[0-9]+$/.test(trimmed);
  if (!digitsOnly) {
    return res.status(400).json({
      error: "Invalid format: 'cedula' must contain only digits (0-9).",
      code: "CEDULA_DIGITS_ONLY",
    });
  }

  if (trimmed.length < 6 || trimmed.length > 12) {
    return res.status(400).json({
      error: "Invalid length: 'cedula' must be between 6 and 12 digits.",
      code: "CEDULA_LENGTH",
    });
  }

  // Attach normalized value for downstream handlers.
  req.validatedCedula = trimmed;
  return next();
}

module.exports = { validateCedula };



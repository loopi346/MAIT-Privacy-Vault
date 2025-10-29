"use strict";

/**
 * controllers/anonymizeController.js
 * ------------------------------------------------------------
 * Hosts request handlers (controllers) for anonymization endpoints.
 * Business logic lives here, separate from transport (routes) and
 * validation (middleware) layers.
 */

/**
 * acknowledgeCedula
 * For now, acknowledges a valid cédula input. Replace with real
 * anonymization (hashing, tokenization, etc.) as you evolve the API.
 *
 * Input:
 *   - req.validatedCedula (string) from middleware
 * Output:
 *   - 200 JSON acknowledgment
 */
function acknowledgeCedula(req, res) {
  // Prefer normalized value from middleware when available.
  const cedula = req.validatedCedula || (req.body && req.body.cedula);

  // Placeholder: future logic could derive or return a token here.
  return res.status(200).json({ status: "Received cédula, ready to anonymize", cedula });
}

module.exports = { acknowledgeCedula };

/**
 * anonymizeCedula
 * ------------------------------------------------------------
 * Applies the configured anonymization strategy and persists the record
 * in MongoDB using the CedulaRecord model. Strategies:
 *   - hash: SHA-256 with per-record salt and app pepper
 *   - token: issue random UUID token
 *
 * Response:
 *   - For hash: { status, id }
 *   - For token: { status, token }
 */
const { CedulaRecord } = require("../models/CedulaRecord");
const { hashWithSalt } = require("../services/hashService");
const { issueToken } = require("../services/tokenService");

async function anonymizeCedula(req, res, next) {
  try {
    const cedula = req.validatedCedula || (req.body && req.body.cedula);
    const strategy = (process.env.ANONYMIZE_STRATEGY || "hash").toLowerCase();

    if (strategy === "token") {
      const token = issueToken();
      const saved = await CedulaRecord.create({ strategy: "token", token });
      return res.status(200).json({ status: "Anonymized via token", token });
    }

    // Default to hash strategy
    const { PEPPER } = process.env;
    const { hash, salt } = hashWithSalt(cedula, PEPPER);
    const saved = await CedulaRecord.create({ strategy: "hash", hash, salt });
    return res.status(200).json({ status: "Anonymized via hash", id: saved.id || saved._id });
  } catch (err) {
    return next(err);
  }
}

module.exports.anonymizeCedula = anonymizeCedula;



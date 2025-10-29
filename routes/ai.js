"use strict";

/**
 * routes/ai.js
 * ------------------------------------------------------------
 * AI-related routes. Uses Gemini to provide guidance, without sending
 * plaintext cédulas. We only send masked/metadata inputs.
 */

const express = require("express");
const { getGuidanceForMaskedCedula } = require("../services/geminiService");

const router = express.Router();

/**
 * POST /ai/gemini/guidance
 * Body: { cedula: string }
 * Returns short guidance without exposing the plaintext cedula to Gemini.
 */
router.post("/gemini/guidance", async (req, res) => {
  try {
    const { cedula } = req.body || {};
    if (typeof cedula !== "string" || cedula.trim().length === 0) {
      return res.status(400).json({ error: "'cedula' is required", code: "CEDULA_REQUIRED" });
    }

    const trimmed = cedula.trim();
    // Mask: only keep last 2 digits; send length and charset info
    const maskedInfo = {
      length: trimmed.length,
      last2: trimmed.slice(-2),
      charset: /^[0-9]+$/.test(trimmed) ? "digits" : "mixed",
      policy: {
        min: Number(process.env.CEDULA_MIN || 6),
        max: Number(process.env.CEDULA_MAX || 12),
        strategy: process.env.ANONYMIZE_STRATEGY || "hash",
      },
    };

    const guidance = await getGuidanceForMaskedCedula(maskedInfo);
    return res.status(200).json({ guidance, masked: maskedInfo });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Gemini error" });
  }
});

module.exports = router;



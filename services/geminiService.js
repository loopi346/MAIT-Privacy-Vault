"use strict";

/**
 * services/geminiService.js
 * ------------------------------------------------------------
 * Thin wrapper around Gemini's SDK to generate guidance without
 * exposing plaintext cédulas (PII). The caller must pass masked or
 * metadata-only inputs.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to cedula.env or .env");
  }
  return new GoogleGenerativeAI(apiKey);
}

async function getGuidanceForMaskedCedula(maskedInfo) {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  const model = client.getGenerativeModel({ model: modelName });

  const prompt = [
    "You are a privacy and data-protection assistant.",
    "User provides metadata or a masked national ID (never plaintext).",
    "Provide short, actionable guidance to anonymize and safely store it.",
    "Constraints: keep the answer under 80 words; no legal disclaimers;",
    "avoid exposing or reconstructing PII.",
    "",
    `Masked/metadata: ${JSON.stringify(maskedInfo)}`,
  ].join("\n");

  const result = await model.generateContent(prompt);
  const text = result?.response?.text?.() || "";
  return text.trim();
}

module.exports = { getGuidanceForMaskedCedula };



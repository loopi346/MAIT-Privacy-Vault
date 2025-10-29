"use strict";

/**
 * services/geminiService.js
 * ------------------------------------------------------------
 * Thin wrapper around Gemini's SDK to generate guidance without
 * exposing plaintext cédulas (PII). The caller must pass masked or
 * metadata-only inputs.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Define el modelo por defecto en un solo lugar para consistencia.
const DEFAULT_MODEL = "gemini-2.5-flash";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing. Add it to cedula.env or .env");
  }
  return new GoogleGenerativeAI(apiKey);
}

async function getGuidanceForMaskedCedula(maskedInfo) {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
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

/**
 * Sends a generic prompt to Gemini for a text completion.
 * @param {string} prompt - The text prompt to send to the AI.
 * @returns {Promise<string>} The text response from the AI.
 */
async function getCompletion(prompt) {
  const client = getGeminiClient();
  const modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const model = client.getGenerativeModel({ model: modelName });

  // Se agrega un prompt de sistema para dar contexto al modelo sobre los tokens.
  const fullPrompt = [
    "Eres un asistente servicial.",
    "El prompt del usuario puede contener tokens especiales como [NOMBRE_1], [EMAIL_2], etc. Estos tokens representan información personal anonimizada.",
    "Trata estos tokens como marcadores de posición para los datos reales.",
    "Si es natural que tu respuesta incluya esta información, por favor, usa los tokens exactos en tu respuesta para que puedan ser convertidos de nuevo a los datos originales.",
    "Por ejemplo, si el usuario dice 'Mi nombre es [NOMBRE_1]', una buena respuesta es 'Hola [NOMBRE_1], ¿cómo puedo ayudarte?'.",
    `\nPrompt del usuario: "${prompt}"`
  ].join('\n');

  const result = await model.generateContent(fullPrompt);
  const text = result?.response?.text?.() || "";
  return text.trim();
}

module.exports = { 
  getGuidanceForMaskedCedula,
  getCompletion,
};

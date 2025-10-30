"use strict";

/**
 * services/piiAnonymizerService.js
 * ------------------------------------------------------------
 * Service to find, anonymize, and deanonymize Personally Identifiable Information (PII)
 * from a given text prompt.
 */

const PiiRecord = require('../models/PiiRecord');

// Regex to find common PII patterns
const piiPatterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // Name detection is complex and prone to errors. This is a simple example.
  // Detecta una o dos palabras que comiencen con mayúscula.
  name: /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g,
  cedula: /\b\d{7,10}\b/g,
};

// Palabras comunes para evitar que se anonimicen como nombres.
const stopWords = new Set(['hola', 'mi', 'nombre', 'es', 'vivo', 'en', 'necesito', 'ayuda', 'con', 'factura', 'cuenta', 'para', 'como', 'estas']);

/**
 * Anonymizes a prompt by replacing PII with tokens.
 * @param {string} prompt - The original text.
 * @returns {Promise<string>} The anonymized prompt.
 */
async function anonymizePrompt(prompt) {
  let anonymizedPrompt = prompt;

  for (const [type, regex] of Object.entries(piiPatterns)) {
    const matches = [...anonymizedPrompt.matchAll(regex)].map(m => m[0]);
    const uniqueMatches = [...new Set(matches)]; // Procesa cada valor único solo una vez

    for (const match of uniqueMatches) {
      if (type === 'name' && stopWords.has(match.toLowerCase())) {
        continue; // No lo anonimices.
      }

      let record = await PiiRecord.findOne({ originalValue: match, piiType: type });

      if (!record) {
        record = new PiiRecord({ originalValue: match, piiType: type });
        await record.save();
      }

      // Reemplaza todas las ocurrencias de este valor en el prompt
      anonymizedPrompt = anonymizedPrompt.replaceAll(match, record.token);
    }
  }

  return anonymizedPrompt;
}

/**
 * Deanonymizes a response by replacing tokens with their original PII values.
 * @param {string} anonymizedResponse - The text from the AI.
 * @returns {Promise<string>} The deanonymized text.
 */
async function deanonymizeResponse(anonymizedResponse) {
  let deanonymizedResponse = anonymizedResponse;
  const tokenRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const tokensFound = anonymizedResponse.match(tokenRegex) || [];

  for (const token of [...new Set(tokensFound)]) {
    const record = await PiiRecord.findOne({ token: token });
    if (record) {
      deanonymizedResponse = deanonymizedResponse.replaceAll(token, record.originalValue);
    }
  }
  return deanonymizedResponse;
}

module.exports = {
  anonymizePrompt,
  deanonymizeResponse,
};
"use strict";

/**
 * services/piiAnonymizerService.js
 * ------------------------------------------------------------
 * Service to find, anonymize, and deanonymize Personally Identifiable Information (PII)
 * from a given text prompt.
 */

// Regex to find common PII patterns
const piiPatterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // Name detection is complex and prone to errors. This is a simple example.
  // It looks for two capitalized words together.
  name: /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/gi, // Se agrega flag 'i' para case-insensitive
  cedula: /\b\d{7,9}\b/g, // Se agrega regex para detectar cédulas
};

/**
 * Anonymizes a prompt by replacing PII with tokens.
 * @param {string} prompt - The original text.
 * @returns {{anonymizedPrompt: string, deanonymizationMap: Map<string, string>}}
 */
function anonymizePrompt(prompt) {
  const deanonymizationMap = new Map();
  let anonymizedPrompt = prompt;
  let piiCounter = 0;

  for (const [type, regex] of Object.entries(piiPatterns)) {
    const matches = anonymizedPrompt.match(regex) || [];
    for (const match of matches) {
      // Avoid re-anonymizing something that's already a token
      if (match.startsWith(`[${type.toUpperCase()}_`)) continue;

      piiCounter++;
      const token = `[${type.toUpperCase()}_${piiCounter}]`;
      
      // Usa replaceAll para un reemplazo más robusto y explícito.
      anonymizedPrompt = anonymizedPrompt.replaceAll(match, token);
      
      // Store the original value for the token
      deanonymizationMap.set(token, match);
    }
  }

  return { anonymizedPrompt, deanonymizationMap };
}

/**
 * Deanonymizes a response by replacing tokens with their original PII values.
 * @param {string} anonymizedResponse - The text from the AI.
 * @param {Map<string, string>} deanonymizationMap - The map of tokens to original values.
 * @returns {string} The deanonymized text.
 */
function deanonymizeResponse(anonymizedResponse, deanonymizationMap) {
  let deanonymizedResponse = anonymizedResponse;
  for (const [token, originalValue] of deanonymizationMap.entries()) {
    // Use split/join to replace all occurrences of the token
    deanonymizedResponse = deanonymizedResponse.replaceAll(token, originalValue);
  }
  return deanonymizedResponse;
}

module.exports = {
  anonymizePrompt,
  deanonymizeResponse,
};
"use strict";

/**
 * services/piiAnonymizerService.js
 * ------------------------------------------------------------
 * Service to find, anonymize, and deanonymize Personally Identifiable Information (PII)
 * from a given text prompt.
 */

// const { v4: uuidv4 } = require('uuid'); // Ya no se necesita para los tokens

// Regex to find common PII patterns
const piiPatterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  // Name detection is complex and prone to errors. This is a simple example.
  // Detecta una o dos palabras que podrían ser un nombre, sensible a mayúsculas/minúsculas.
  name: /\b[a-z]{4,}(?:\s[a-z]+)?\b/gi,
  cedula: /\b\d{7,9}\b/g,
};

// Palabras comunes para evitar que se anonimicen como nombres.
const stopWords = new Set(['hola', 'mi', 'nombre', 'es', 'vivo', 'en', 'necesito', 'ayuda', 'con', 'factura', 'cuenta', 'para', 'como', 'estas']);

/**
 * Genera un sufijo aleatorio de 3 caracteres (letras o números).
 * @returns {string}
 */
function generateRandomSuffix() {
  let suffix = '';
  if (Math.random() > 0.5) { // Generar letras
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    for (let i = 0; i < 3; i++) {
      suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  } else { // Generar números
    const digits = '0123456789';
    for (let i = 0; i < 3; i++) {
      suffix += digits.charAt(Math.floor(Math.random() * digits.length));
    }
  }
  return suffix;
}

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
    // Usamos una función de reemplazo para tener más control
    anonymizedPrompt = anonymizedPrompt.replaceAll(regex, (match) => {
      // Si es un nombre, verifica que no sea una palabra común.
      if (type === 'name' && stopWords.has(match.toLowerCase())) {
        return match; // No lo anonimices.
      }

      // Evita re-anonimizar un token que ya existe
      if (deanonymizationMap.has(match)) return match;
      piiCounter++;
      const token = `[${type.substring(0, 3).toUpperCase()}${piiCounter}-${generateRandomSuffix()}]`;
      deanonymizationMap.set(token, match);
      return token;
    });
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
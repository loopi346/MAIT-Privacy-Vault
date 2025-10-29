"use strict";

/**
 * list_models.js
 * ------------------------------------------------------------
 * Este script se conecta a la API de Google Generative AI para listar
 * todos los modelos disponibles que soportan el método 'generateContent'.
 */

// Carga las variables de entorno desde cedula.env
require('dotenv').config({ path: './cedula.env' });

const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("Error: GEMINI_API_KEY no se encuentra. Asegúrate de que esté en el archivo cedula.env");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  console.log("Buscando modelos de Gemini disponibles para tu API key...\n");
  const result = await genAI.listModels();
  result.models.filter(m => m.supportedGenerationMethods.includes('generateContent')).forEach(m => console.log(`- ${m.name}`));
}

run().catch(console.error);
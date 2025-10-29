"use strict";

/**
 * Privacy Vault - Servidor Mínimo de Express
 * ------------------------------------------------------------
 
 *
 * Propósito:
 *   - Proporcionar un punto de partida limpio y bien documentado para un servicio
 *     de Node.js que alojará las APIs de Privacy Vault.
 *   - Demostrar la separación de responsabilidades manteniendo la lógica de
 *     enrutamiento fuera del flujo principal de inicialización del servidor.
 *
 */

// 1) Importación de módulos e inicialización de la aplicación --------------------
// Express es el framework web minimalista que usamos para declarar rutas HTTP.
// dotenv carga las variables de entorno desde un archivo .env local en process.env.
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Usaremos UUID para anonimizar
const { anonymizePrompt, deanonymizeResponse } = require('./services/piiAnonymizerService');
const { getCompletion } = require('./services/geminiService');

// Prefiere cedula.env si está presente; de lo contrario, usa .env
const cedulaEnvPath = path.join(process.cwd(), "cedula.env");
const defaultEnvPath = path.join(process.cwd(), ".env");
if (fs.existsSync(cedulaEnvPath)) {
  require("dotenv").config({ path: cedulaEnvPath });
} else {
  require("dotenv").config({ path: defaultEnvPath });
}

// Crea una única instancia de la aplicación Express para nuestro servicio.
// Mantén este archivo enfocado en la configuración, no en la lógica de negocio.
const app = express();

// Define el puerto. Prefiere la variable de entorno si está disponible, si no, usa un valor por defecto.
// Se usa 3001 para coincidir con el archivo de test (cedula_test.js).
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// 2) Configuración de middleware global -------------------------
// Analiza las solicitudes entrantes con payloads JSON para que req.body esté disponible como objeto.
// Agrega más middleware globales aquí (CORS, logging, cabeceras de seguridad) cuando sea necesario.
app.use(express.json());

// Sirve un frontend mínimo desde el directorio /public.
app.use(express.static("public"));

// --- Conexión a MongoDB ---
// Usa MONGODB_URI de tu archivo cedula.env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('No se pudo conectar a MongoDB:', err));

// --- Modelo de Mongoose ---
// Guardaremos la cédula original y su versión anonimizada
const CedulaSchema = new mongoose.Schema({
  cedulaOriginal: { type: String, required: true, unique: true },
  cedulaAnonimizada: { type: String, required: true, unique: true, default: () => uuidv4() },
  createdAt: { type: Date, default: Date.now },
});

const Cedula = mongoose.model('Cedula', CedulaSchema);

// 3) Definiciones de rutas -------------------------------
// En lugar de usar routers externos, definimos las rutas directamente aquí para simplicidad.

// Endpoint de salud para verificar que el servidor y la BD funcionan
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    dbState: mongoose.STATES[mongoose.connection.readyState] // Muestra el estado de la conexión a la BD
  });
});

// --- Función de Validación ---
// Centralizamos la lógica de validación para reutilizarla y dar errores más claros.
function validateCedula(cedula) {
  if (!cedula) {
    return { isValid: false, error: 'La cédula no puede estar vacía.' };
  }
  if (!/^\d+$/.test(cedula)) {
    return { isValid: false, error: 'La cédula solo debe contener dígitos.' };
  }
  if (cedula.length < 7 || cedula.length > 9) {
    return { isValid: false, error: `La cédula debe tener entre 7 y 9 dígitos (actualmente tiene ${cedula.length}).` };
  }
  return { isValid: true, error: null };
}

// Endpoint para validar el formato de una cédula
app.post('/anonymize/cedula', (req, res) => {
  const { cedula } = req.body;
  const validation = validateCedula(cedula);
  if (!validation.isValid) {
    return res.status(400).json({ status: 400, error: validation.error });
  }
  // Aquí se podría llamar a la API de Google Generative AI si fuera necesario para una validación más compleja.
  res.status(200).json({ status: 200, message: 'Cédula con formato válido.', cedula });
});

// Endpoint para anonimizar y guardar la cédula
app.post('/anonymize/cedula/anonymize', async (req, res) => {
  const { cedula } = req.body;
  const validation = validateCedula(cedula);
  if (!validation.isValid) {
    return res.status(400).json({ status: 400, error: validation.error });
  }
  try {
    // Busca si la cédula ya existe para no duplicarla
    let registro = await Cedula.findOne({ cedulaOriginal: cedula });
    if (!registro) {
      // Si no existe, crea un nuevo registro
      registro = new Cedula({ cedulaOriginal: cedula });
      await registro.save();
    }
    res.status(201).json({ status: 201, cedulaAnonimizada: registro.cedulaAnonimizada });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: 'Error interno del servidor al guardar la cédula.' });
  }
});

// Endpoint para desanonimizar una cédula
app.post('/deanonymize', async (req, res) => {
  const { cedulaAnonimizada } = req.body;
  if (!cedulaAnonimizada) {
    return res.status(400).json({ status: 400, error: 'Se requiere la cédula anonimizada.' });
  }
  try {
    const registro = await Cedula.findOne({ cedulaAnonimizada: cedulaAnonimizada });
    if (!registro) {
      return res.status(404).json({ status: 404, error: 'Cédula anonimizada no encontrada.' });
    }
    res.status(200).json({ status: 200, cedulaOriginal: registro.cedulaOriginal });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: 'Error interno del servidor al buscar la cédula.' });
  }
});

// --- ¡NUEVO ENDPOINT SECURE GEMINI! ---
app.post('/secure-gemini', async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ status: 400, error: 'Se requiere un "prompt" de tipo texto.' });
  }

  try {
    // 1. Anonimizar el prompt del usuario
    const { anonymizedPrompt, deanonymizationMap } = anonymizePrompt(prompt);

    // 2. Enviar el prompt anonimizado a Gemini
    const aiResponse = await getCompletion(anonymizedPrompt);

    // 3. Desanonimizar la respuesta de Gemini
    const finalResponse = deanonymizeResponse(aiResponse, deanonymizationMap);

    // 4. Enviar la respuesta final y segura al cliente
    res.status(200).json({
      status: 200,
      respuestaIA: aiResponse,             // Respuesta original de la IA para depuración
      promptAnonimizado: anonymizedPrompt, // Prompt anonimizado para depuración
      respuestaFinal: finalResponse,       // Respuesta final para el usuario
    });
  } catch (error) {
    console.error('Error en el endpoint /secure-gemini:', error);
    // Devuelve un error más específico al cliente para facilitar el diagnóstico.
    res.status(500).json({ 
      status: 500, 
      error: `Error al procesar con Gemini: ${error.message}` 
    });
  }
});

// 4) Inicio del servidor ------------------------------------------
// Inicia el servidor HTTP y escucha en el puerto especificado.
app.listen(port, () => {
  console.log(`Privacy Vault API está corriendo en http://localhost:${port}`);
});

// Exporta la instancia de la aplicación para posibles pruebas o integraciones futuras.
module.exports = app;

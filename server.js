"use strict";

/**
 * Privacy Vault - Minimal Express Server
 * ------------------------------------------------------------
 
 *
 * Purpose:
 *   - Provide a clean, well-documented starting point for a Node.js
 *     service that will host Privacy Vault APIs.
 *   - Demonstrate separation of concerns by keeping routing logic
 *     out of the main server initialization flow.
 *
 */

// 1) Module imports and app initialization --------------------
// Express is the minimalist web framework we use to declare HTTP routes.
// dotenv loads environment variables from a local env file into process.env.
const express = require("express");
const fs = require("fs");
const path = require("path");
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Usaremos UUID para anonimizar

// Prefer cedula.env if present; otherwise fallback to .env
const cedulaEnvPath = path.join(process.cwd(), "cedula.env");
const defaultEnvPath = path.join(process.cwd(), ".env");
if (fs.existsSync(cedulaEnvPath)) {
  require("dotenv").config({ path: cedulaEnvPath });
} else {
  require("dotenv").config({ path: defaultEnvPath });
}

// Create a single Express application instance for our service.
// Keep this file focused on wiring, not business logic.
const app = express();

// Define the port. Prefer environment variable when available, else default.
// Se usa 3001 para coincidir con el archivo de test (cedula_test.js).
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

// 2) Global middleware configuration -------------------------
// Parse incoming requests with JSON payloads so req.body is available as an object.
// Add more global middleware here (CORS, logging, security headers) when needed.
app.use(express.json());

// Serve a minimal frontend from the /public directory.
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

// 3) Route definitions -------------------------------
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
    res.status(201).json({ status: 201, data: { cedulaAnonimizada: registro.cedulaAnonimizada } });
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
    res.status(200).json({ status: 200, data: { cedulaOriginal: registro.cedulaOriginal } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 500, error: 'Error interno del servidor al buscar la cédula.' });
  }
});

// 4) Server startup ------------------------------------------
// Inicia el servidor HTTP.
app.listen(port, () => {
  console.log(`Privacy Vault API está corriendo en http://localhost:${port}`);
});

// Export the app instance for potential future testing or integration.
module.exports = app;

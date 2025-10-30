"use strict";

const mongoose = require('mongoose');

// --- Modelo de Mongoose Generalizado ---
// Guardaremos cualquier dato sensible (PII) y su token.
const PiiRecordSchema = new mongoose.Schema({
  originalValue: { type: String, required: true, unique: true },
  token: { type: String, required: true, unique: true, default: () => require('crypto').randomUUID() },
  piiType: { type: String, required: true, index: true }, // 'cedula', 'name', 'email'
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PiiRecord', PiiRecordSchema);
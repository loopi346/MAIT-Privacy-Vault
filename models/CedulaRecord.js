"use strict";

/**
 * models/CedulaRecord.js
 * ------------------------------------------------------------
 * Mongoose model for storing anonymized cédula records.
 * Never store the plaintext cédula.
 */

const { Schema, model } = require("mongoose");

const CedulaRecordSchema = new Schema(
  {
    strategy: { type: String, enum: ["hash", "token"], required: true },
    hash: { type: String },
    salt: { type: String },
    token: { type: String, unique: true, sparse: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const CedulaRecord = model("CedulaRecord", CedulaRecordSchema);

module.exports = { CedulaRecord };



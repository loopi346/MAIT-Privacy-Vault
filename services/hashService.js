"use strict";

/**
 * services/hashService.js
 * ------------------------------------------------------------
 * Hashing utilities for irreversible anonymization using SHA-256
 * with per-record salt and application-level pepper.
 */

const crypto = require("crypto");

function hashWithSalt(plain, pepper) {
  if (typeof plain !== "string") {
    throw new Error("hashWithSalt: 'plain' must be a string");
  }
  const safePepper = typeof pepper === "string" ? pepper : "";
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${plain}${salt}${safePepper}`)
    .digest("hex");
  return { hash, salt };
}

function verify(plain, salt, pepper, expectedHash) {
  const safePepper = typeof pepper === "string" ? pepper : "";
  const hash = crypto
    .createHash("sha256")
    .update(`${plain}${salt}${safePepper}`)
    .digest("hex");
  return hash === expectedHash;
}

module.exports = { hashWithSalt, verify };



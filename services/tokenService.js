"use strict";

/**
 * services/tokenService.js
 * ------------------------------------------------------------
 * Tokenization utility that issues a random UUIDv4 token which can be
 * stored and later resolved back to a record.
 */

const { randomUUID } = require("crypto");

function issueToken() {
  return randomUUID();
}

module.exports = { issueToken };



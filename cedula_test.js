"use strict";

/**
 * cedula_test.js
 * ------------------------------------------------------------
 * Simple test runner for the cédula endpoints using Node's built-in fetch.
 *
 * What it does:
 *   1) POST /anonymize/cedula with a valid body
 *   2) POST /anonymize/cedula with an invalid body
 *   3) POST /anonymize/cedula/anonymize with a valid body
 *
 * How to run:
 *   node cedula_test.js
 *
 * Configuration:
 *   - PORT via .env or environment; defaults to 3001
 */

const BASE_URL = `http://localhost:${process.env.PORT ? Number(process.env.PORT) : 3001}`;

async function postJson(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const data = isJson ? await response.json() : await response.text();
  return { status: response.status, data };
}

async function run() {
  try {
    console.log("1) Testing ACK endpoint with valid cedula...");
    const ackOk = await postJson("/anonymize/cedula", { cedula: "12345678" });
    console.log("Status:", ackOk.status, "Response:", ackOk.data);

    console.log("\n2) Testing ACK endpoint with invalid cedula (non-digits)...");
    const ackBad = await postJson("/anonymize/cedula", { cedula: "12A456" });
    console.log("Status:", ackBad.status, "Response:", ackBad.data);

    console.log("\n3) Testing anonymize endpoint with valid cedula...");
    const anonymized = await postJson("/anonymize/cedula/anonymize", { cedula: "12345678" });
    console.log("Status:", anonymized.status, "Response:", anonymized.data);

    console.log("\nDone.");
  } catch (err) {
    console.error("Test run failed:", err);
    process.exit(1);
  }
}

run();



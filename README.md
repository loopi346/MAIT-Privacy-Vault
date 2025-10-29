Privacy Vault API (Node.js + Express + MongoDB)

Minimal, well-structured API to receive and anonymize national IDs (cédulas). Clean layering: server (wiring), routes, middleware, controllers, services, models, db. MongoDB via Mongoose. Non-blocking startup: the HTTP server starts even if DB is down; DB-dependent routes return 503 until connected.

Requirements
- Node.js 18+
- MongoDB (local service, Docker, or Atlas)

Install
```
npm install
```

If starting from scratch:
```
npm init -y
npm install express mongoose dotenv
npm install --save-dev nodemon
```

Environment variables
Create `cedula.env` (preferred) or `.env` in project root:
```
MONGODB_URI=mongodb://127.0.0.1:27017/privacy_vault
PORT=3001
ANONYMIZE_STRATEGY=hash
PEPPER=change-this-to-a-long-random-secret
CEDULA_MIN=6
CEDULA_MAX=12
```
- Windows PowerShell quick create:
```
Set-Content -Path cedula.env -Value @"
MONGODB_URI=mongodb://127.0.0.1:27017/privacy_vault
PORT=3001
ANONYMIZE_STRATEGY=hash
PEPPER=change-this-to-a-long-random-secret
CEDULA_MIN=6
CEDULA_MAX=12
"@
```

Start MongoDB
- Docker:
```
docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo:7
```
- Local service (Windows): install MongoDB Community and ensure it is running.
- Atlas: use a `mongodb+srv://` URI and allow your IP.

Run the API
```
npm run start
# or
npm run dev
```
You should see: `Privacy Vault API is running on http://localhost:3001`. If DB connects later: `MongoDB connected.` If it fails, the server still runs and DB routes will return 503.

Endpoints
- Health
  - GET `/health` → `{ http: "ok", db: "connected|connecting|disconnected" }`

- Cédula (acknowledge only, no DB required)
  - POST `/anonymize/cedula`
  - Body: `{ "cedula": "12345678" }`
  - 200: `{ "status": "Received cédula, ready to anonymize", "cedula": "12345678" }`

- Cédula (anonymize + persist, requires DB)
  - POST `/anonymize/cedula/anonymize`
  - Body: `{ "cedula": "12345678" }`
  - Strategy `hash` (default): `{ "status": "Anonymized via hash", "id": "<recordId>" }`
  - Strategy `token`: `{ "status": "Anonymized via token", "token": "<uuid>" }`
  - If DB disconnected: `503 { "error": "Service unavailable: database not connected" }`

- AI Guidance (Gemini)
  - POST `/ai/gemini/guidance`
  - Body: `{ "cedula": "12345678" }` (only masked metadata is sent to Gemini)
  - 200: `{ guidance: string, masked: { length, last2, charset, policy } }`

Quick testing (PowerShell)
```
# Health
Invoke-RestMethod -Method Get -Uri http://localhost:3001/health

# ACK
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3001/anonymize/cedula `
  -ContentType 'application/json' `
  -Body (@{cedula='12345678'} | ConvertTo-Json)

# Anonymize (DB required)
Invoke-RestMethod -Method Post `
  -Uri http://localhost:3001/anonymize/cedula/anonymize `
  -ContentType 'application/json' `
  -Body (@{cedula='12345678'} | ConvertTo-Json)
```

Project structure
```
server.js
routes/
  anonymize.js
  health.js
  ai.js
middleware/
  validateCedula.js
  requireDb.js
controllers/
  anonymizeController.js
services/
  hashService.js
  tokenService.js
  geminiService.js
db/
  mongo.js
models/
  CedulaRecord.js
cedula_test.js
```

Notes and security
- Never store plaintext cédulas. Hash strategy uses SHA-256 with per-record salt + application PEPPER.
- Avoid logging sensitive data.
- Consider adding `helmet`, `cors` with allowlist, `express-rate-limit`, and structured logging (`pino-http`).

License
MIT


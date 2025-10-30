# Privacy Vault

Este proyecto es una solución integral de backend y frontend diseñada para demostrar una arquitectura robusta de protección de la privacidad. El sistema anonimiza de forma persistente cualquier tipo de Información de Identificación Personal (PII) detectada, como cédulas, nombres o correos electrónicos, antes de procesarla o enviarla a servicios de terceros como la API de Google Gemini.

## Características

- **Sistema de Anonimización Unificado**: Toda la PII detectada (cédulas, nombres, emails, etc.) se guarda en una única colección de MongoDB. A cada dato sensible se le asigna un token único y persistente (UUID).
- **Chat Seguro con IA Persistente**: El chat con la IA utiliza el mismo sistema de persistencia. Cualquier dato sensible en la conversación se guarda en la base de datos y se reemplaza por su token correspondiente antes de interactuar con la API de Gemini.
- **Interfaz de Usuario Intuitiva**: Un único archivo `index.html` con Vanilla JavaScript que proporciona una consola interactiva para probar todas las funcionalidades de la API, incluyendo:
    - Sección de anonimización/desanonimización de cédulas.
    - Sección de chat seguro con la IA.
    - Visualización de respuestas y estado del servicio.
- **Monitoreo de Salud**: Incluye un endpoint `GET /health` para verificar el estado del servidor y la conexión a la base de datos en tiempo real.

## Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18.x o superior)
- [MongoDB](https://www.mongodb.com/try/download/community)
- Una clave de API de Google Gemini. Puedes obtener una en [Google AI Studio](https://aistudio.google.com/app/apikey).

## Instalación y Configuración

1.  **Clonar el repositorio:**
    ```bash
    git clone <URL-DEL-REPOSITORIO>
    cd <NOMBRE-DEL-DIRECTORIO>
    ```

2.  **Instalar dependencias:**
    ```bash
    npm install
    ```

3.  **Configurar las variables de entorno:**
    Crea un archivo llamado `cedula.env` en la raíz del proyecto. Puedes copiar el archivo de ejemplo:
    ```bash
    cp cedula.env.example cedula.env
    ```
    Luego, edita el archivo `cedula.env` y añade tus propias claves y configuraciones:
    ```
    GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
    MONGODB_URI="mongodb://localhost:27017/privacy_vault"
    PORT=3001
    ```

4.  **(Opcional) Configurar `package.json`:**
    Para usar los scripts de `npm`, asegúrate de que tu `package.json` tenga una sección de `scripts` como esta:
    ```json
    "scripts": {
      "start": "node server.js",
      "dev": "nodemon server.js",
      "test": "node cedula_test.js"
    }
    ```
    Si no tienes un `package.json`, puedes crearlo con `npm init -y` y luego agregar la sección de `scripts`.

## Cómo usar la aplicación

1.  **Iniciar el servidor:**
    Usando npm (recomendado):
    ```bash
    npm start
    ```
    O directamente con Node:
    ```bash
    node server.js
    ```
    El servidor se iniciará en `http://localhost:3001` por defecto.

2.  **Abrir la interfaz web:**
    Abre tu navegador y ve a `http://localhost:3001`.

## Scripts Útiles

### Ejecutar pruebas (`cedula_test.js`)

Para verificar que los endpoints básicos de cédula funcionan correctamente:
```bash
npm test
```

### Listar modelos de IA

Para ver qué modelos de Gemini están disponibles con tu clave de API, ejecuta:
```bash
node list_models.js
```

## Endpoints de la API

- `GET /health`: Verifica el estado del servidor y la conexión a la base de datos.
- `POST /anonymize/cedula`: Valida el formato de una cédula.
- `POST /anonymize/cedula/anonymize`: Guarda una cédula y devuelve un identificador anonimizado.
- `POST /deanonymize`: Recupera la cédula original a partir de su identificador anonimizado.
- `POST /secure-gemini`: Envía un prompt a la IA de forma segura, anonimizando y desanonimizando la información sensible.
# Privacy Vault

Este proyecto es una solución integral de backend y frontend diseñada para demostrar una arquitectura robusta de protección de la privacidad. El sistema anonimiza de forma persistente cualquier tipo de Información de Identificación Personal (PII) detectada (como cédulas, nombres, correos electrónicos, etc.) antes de procesarla o enviarla a servicios de terceros como la API de Google Gemini.

## Características

- **Sistema de Anonimización y Persistencia Unificado**: Toda la PII detectada (cédulas, nombres, emails, teléfonos) se gestiona a través de un único sistema. Cada dato sensible se guarda en una colección `PiiRecord` de MongoDB y se le asigna un token UUID único y persistente. Este token se utiliza para anonimizar el dato en el texto.
- **Chat Seguro con IA**: El chat con la IA utiliza este sistema de anonimización persistente. Cualquier PII en el prompt del usuario se anonimiza (guardando o recuperando el token de la BD) antes de enviarse a Gemini. La respuesta de la IA se desanonimiza utilizando los mismos tokens persistentes antes de ser mostrada al usuario.
- **Interfaz de Usuario Intuitiva**: Un único archivo `index.html` con Vanilla JavaScript que proporciona una consola interactiva para probar todas las funcionalidades de la API, incluyendo:
    - Sección de anonimización/desanonimización de cédulas.
    - Sección de chat seguro con la IA.
    - Visualización de respuestas y estado del servicio.
- **Monitoreo de Salud**: Incluye un endpoint `GET /health` para verificar el estado del servidor y la conexión a la base de datos en tiempo real, mostrando el estado de Mongoose.

## Prerrequisitos

- [Node.js](https://nodejs.org/) (versión 18.x o superior)
- Una cuenta de [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) (el plan gratuito es suficiente).
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
    Luego, edita el archivo `cedula.env` y añade tus propias claves. Para la base de datos, sigue estos pasos (o usa tu propia URL de conexión si ya la tienes):
    
    a. **Crea un cluster gratuito en MongoDB Atlas.**
    b. En la sección "Database Access", **crea un usuario y contraseña** para la base de datos.
    c. En la sección "Network Access", **permite el acceso desde cualquier lugar** (IP `0.0.0.0/0`).
    d. En la vista principal del cluster, haz clic en "Connect" -> "Drivers" y **copia la URL de conexión**.
    
    Finalmente, edita tu archivo `cedula.env` con tus claves y la URL de tu base de datos:
    ```
    GEMINI_API_KEY="TU_API_KEY_DE_GEMINI"
    # Reemplaza <username>, <password> y la URL de tu cluster.
    MONGODB_URI="mongodb+srv://<username>:<password>@<tu-cluster-url>/privacy_vault?retryWrites=true&w=majority"
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
- `POST /deanonymize`: Recupera la cédula original a partir de su identificador anonimizado (token UUID).
- `POST /secure-gemini`: Envía un prompt a la IA de forma segura, anonimizando y desanonimizando la información sensible.

### `GET /health`
- **Descripción**: Verifica el estado del servidor y la conexión a la base de datos.
- **Respuesta Exitosa (200)**: `{"status":"ok","uptime":123.45,"dbState":"connected"}`

### `POST /anonymize/cedula`
- **Descripción**: Valida si el formato de una cédula es correcto (7 a 10 dígitos numéricos). No guarda nada.
- **Body**: `{"cedula": "12345678"}`
- **Respuesta Exitosa (200)**: `{"status":200,"message":"Cédula con formato válido.","cedula":"12345678"}`
- **Respuesta de Error (400)**: `{"status":400,"error":"La cédula debe tener entre 7 y 10 dígitos..."}`

### `POST /anonymize/cedula/anonymize`
- **Descripción**: Valida una cédula, la guarda en la base de datos (`PiiRecord`) si no existe, y devuelve su token UUID persistente.
- **Body**: `{"cedula": "12345678"}`
- **Respuesta Exitosa (201)**: `{"status":201,"cedulaAnonimizada":"a1b2c3d4-..."}`

### `POST /deanonymize`
- **Descripción**: Recibe un token UUID y devuelve la cédula original asociada si se encuentra en la base de datos (`PiiRecord`).
- **Body**: `{"cedulaAnonimizada": "a1b2c3d4-..."}`
- **Respuesta Exitosa (200)**: `{"status":200,"cedulaOriginal":"12345678"}`
- **Respuesta de Error (404)**: `{"status":404,"error":"Cédula anonimizada no encontrada."}`

### `POST /secure-gemini`
- **Descripción**: Orquesta el flujo de chat seguro. Recibe un prompt, anonimiza la PII (nombres, emails, teléfonos, cédulas) usando el sistema de persistencia (`PiiRecord`), lo envía a Gemini, recibe la respuesta, la desanonimiza y la devuelve al cliente.
- **Body**: `{"prompt": "Hola, mi nombre es Juan Pérez y mi cédula es 12345678"}`
- **Respuesta Exitosa (200)**:
  ```json
  {
    "status": 200,
    "respuestaIA": "Hola [UUID_TOKEN_DE_JUAN], ¿en qué puedo ayudarte con tu cédula [UUID_TOKEN_DE_CEDULA]?",
    "promptAnonimizado": "Hola, mi nombre es [UUID_TOKEN_DE_JUAN] y mi cédula es [UUID_TOKEN_DE_CEDULA]",
    "respuestaFinal": "Hola Juan Pérez, ¿en qué puedo ayudarte con tu cédula 12345678?"
  }
  ```
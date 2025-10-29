# Privacy Vault

Este proyecto es un servicio de backend y frontend diseñado para demostrar técnicas de protección de la privacidad, como la anonimización de datos y la interacción segura con modelos de lenguaje de IA.

## Características

- **API de Anonimización**: Endpoints para validar, anonimizar (guardar) y desanonimizar (recuperar) identificadores personales (cédulas).
- **Chat Seguro con IA**: Una interfaz de chat que filtra información de identificación personal (PII) como nombres, correos electrónicos y números de cédula antes de enviar el prompt a la API de Google Gemini. La respuesta de la IA también se desanonimiza antes de mostrarla al usuario.
- **Interfaz Web Simple**: Un frontend básico para interactuar con todos los servicios de la API.
- **Base de Datos Segura**: Utiliza MongoDB para almacenar la relación entre los datos originales y sus identificadores anonimizados.

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

## Cómo usar la aplicación

1.  **Iniciar el servidor:**
    ```bash
    node server.js
    ```
    El servidor se iniciará en `http://localhost:3001` por defecto.

2.  **Abrir la interfaz web:**
    Abre tu navegador y ve a `http://localhost:3001`.

## Scripts Útiles

### Ejecutar pruebas

Para verificar que los endpoints básicos funcionan correctamente, puedes ejecutar el script de prueba:
```bash
node cedula_test.js
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
- `POST /deanonymize`: Recupera la cédula original a partir de un identificador anonimizado.
- `POST /secure-gemini`: Envía un prompt a la IA de forma segura, anonimizando y desanonimizando la información sensible.
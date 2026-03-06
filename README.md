# Challenge Sr Fullstack - Microservicios (E-commerce)

Este repositorio contiene la solución al desafío técnico, el cual consistió en diagnosticar y refactorizar un backend monolítico en NestJS con problemas estructurales, transicionar su lógica hacia un modelo *Event-Driven*, y consumir este flujo asincrónico desde un nuevo Frontend en React.

## 1. Diagnóstico y Problemas Detectados en el Diseño Original

Al analizar el código base proporcionado, se identificaron fallas arquitectónicas y de validación que impedían el correcto funcionamiento del sistema:

* **Fallas en DTOs y Endpoints de Creación/Detalles:** El flujo principal de productos estaba roto. Al intentar agregar detalles a un producto (`POST /product/:id/details`), el sistema fallaba debido a que los DTOs no exigían ni mapeaban correctamente campos obligatorios requeridos por las entidades de la base de datos (por ejemplo, faltaba validación estricta para `variationType`, `description`, `about` y la estructura de `details`). Esto a su vez impedía que el producto pudiera pasar a estado `isActive = true`. Se corrigieron estas validaciones para asegurar la integridad de los datos.
* **Acoplamiento Fuerte y Sincronía:** La lógica de negocio estaba altamente acoplada. Las acciones de dominio no emitían señales hacia el resto del ecosistema, dificultando la escalabilidad y rompiendo el principio de responsabilidad única. 
* **Ausencia de Configuración SSL en TypeORM:** La configuración original de la base de datos no contemplaba el uso de conexiones seguras (SSL), lo que imposibilitaba el despliegue directo en proveedores Cloud modernos (generando errores de conexión `ECONNREFUSED`).

## 2. Implementación de Eventos de Dominio (Backend)

Para desacoplar el sistema y prepararlo para una arquitectura reactiva, se integró el módulo `EventEmitter2` nativo de NestJS. Se diseñaron e implementaron los siguientes eventos de dominio:

1.  **`product.created` (PRODUCT_CREATED)**
    * **Cuándo se emite:** Inmediatamente después de persistir la entidad base de un producto nuevo en el endpoint de creación.
    * **Por qué:** Permite que servicios paralelos (como un motor de indexación de búsquedas o un servicio de notificaciones a integradores) reaccionen a la creación del recurso sin bloquear el ciclo de respuesta HTTP del cliente.

2.  **`product.activated` (PRODUCT_ACTIVATED)**
    * **Cuándo se emite:** Cuando el producto cumple con todos los requisitos de detalles y se dispara el endpoint de activación, cambiando su estado `isActive` a `true`.
    * **Por qué:** Es el evento transaccional más importante del dominio. Permite que consumidores desacoplados, como un servicio de Inventario, inicialicen el stock de ese producto, o que el Catálogo público lo habilite para su visualización de forma asíncrona.

## 3. Frontend y Consumo de Eventos en Tiempo Real

Se desarrolló una SPA (Single Page Application) utilizando **React + Vite** para consumir la API y validar el sistema end-to-end.

* **Flujo Asincrónico:** Para reflejar el modelo *Event-Driven* en el cliente, el backend expone un endpoint (`/product/stream-events`) que transmite los eventos de dominio en tiempo real.
* **Integración:** El Frontend consume este flujo utilizando la API nativa de navegadores `EventSource`. Al detectar los eventos `PRODUCT_CREATED` o `PRODUCT_ACTIVATED`, el cliente reacciona inyectando un log visual en la UI y disparando una recarga de estado silenciosa para actualizar la grilla de productos, todo sin intervención manual del usuario.

## 4. Decisiones Técnicas Relevantes

* **Server-Sent Events (SSE) vs WebSockets:** Para la transmisión de eventos al cliente, se optó por SSE. Dado que el requerimiento se basaba en escuchar eventos del dominio de forma unidireccional (Servidor -> Cliente), SSE resultó ser una solución mucho más liviana, nativa sobre HTTP puro y con menor *overhead* de infraestructura en comparación con implementaciones bidireccionales como Socket.io o WebSockets.
* **Adaptación Cloud-Ready:** Se modificó la configuración de TypeORM (`src/database/typeorm/typeOrm.config.ts`) para inyectar dinámicamente credenciales mediante variables de entorno y se forzó la propiedad `ssl: { rejectUnauthorized: false }` para asegurar compatibilidad con la base de datos gestionada en la nube.
* **Inyección de Entorno Dinámica en Vite:** Se configuró el cliente Axios y el EventSource para consumir la variable `VITE_API_URL` en tiempo de compilación, permitiendo usar el mismo código tanto para desarrollo local (`localhost`) como para el entorno de producción.

## 5. Deploy y URLs Públicas de Acceso

El ecosistema completo fue desplegado en la plataforma **Render**, garantizando un entorno 100% operativo en la nube:

* **Base de Datos:** PostgreSQL 16 (Gestionado)
* **Backend API (Node.js/NestJS):** [https://challengemicroservicios.onrender.com](https://challengemicroservicios.onrender.com)
* **Frontend (React/Static Site):** [https://challengemicroservicios-front.onrender.com/](https://challengemicroservicios-front.onrender.com/)

## 6. Instrucciones para Ejecución Local

### Pre-requisitos
* Node.js (v18 o superior)
* PostgreSQL corriendo localmente o mediante Docker.

### Configuración del Backend
1.  Navegar a la carpeta raíz del proyecto.
2.  Configurar las credenciales locales de la base de datos en un archivo de entorno basado en las variables requeridas por `src/database/typeorm/typeOrm.config.ts`.
3.  Instalar dependencias y levantar el servidor:
    ```bash
    npm install
    npm run migration:run
    npm run seed
    npm run start:dev
    ```

### Configuración del Frontend
1.  Navegar al directorio `/frontend`.
2.  Instalar dependencias y levantar el cliente (por defecto apuntará a `http://localhost:3000` si no se provee un archivo `.env`):
    ```bash
    npm install
    npm run dev
    ```
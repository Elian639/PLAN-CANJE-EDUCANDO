# Plan Canje Educativo — Netlify + Render

Arquitectura de producción:

- **Netlify:** frontend estático (HTML/CSS/JS/imágenes).
- **Render:** backend Node.js + Express + JWT.
- **Render PostgreSQL:** base de datos.

## 1. Backend en Render

Crear el servicio desde `render.yaml` o configurar manualmente:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `npm start`
- Health Check: `/health`

Variables de entorno:

- `NODE_ENV=production`
- `JWT_SECRET` — generada por Render o una clave segura.
- `ADMIN_EMAIL`
- `ADMIN_INITIAL_PASSWORD` — cargar manualmente; no subirla a GitHub.
- `DATABASE_URL` — conexión a PostgreSQL.
- `FRONTEND_URL` — URL final de Netlify, por ejemplo `https://tu-sitio.netlify.app`.

Al arrancar, el backend crea las tablas y el administrador inicial si todavía no existe.

## 2. Frontend en Netlify

Publicar la carpeta raíz del proyecto (la que contiene `index.html`). Netlify usa `netlify.toml` y publica `.`.

Antes de publicar, editar `js/config.js`:

```js
window.API_BASE_URL = "https://TU-BACKEND.onrender.com/api";
```

No poner `/` al final de la URL.

## 3. Orden recomendado

1. Crear PostgreSQL + backend en Render.
2. Esperar a que `/health` responda `ok: true`.
3. Copiar la URL pública del Web Service de Render.
4. Pegar esa URL en `js/config.js` con `/api`.
5. Publicar el frontend en Netlify.
6. Copiar la URL final de Netlify a `FRONTEND_URL` en Render.
7. Probar registro, login, panel, recomendaciones, puntos, canjes y administración.

## 4. Seguridad

No subir `.env`, contraseñas reales ni secretos a GitHub.

El frontend nunca contiene `DATABASE_URL` ni `JWT_SECRET`; solamente conoce la URL pública de la API.

## 5. Desarrollo local

Si `js/config.js` se deja con una URL de Render, el frontend local consumirá esa API. Para trabajar completamente local se puede cambiar temporalmente a:

```js
window.API_BASE_URL = "http://localhost:3000/api";
```

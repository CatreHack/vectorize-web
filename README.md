# Vectorize Web — Frontend

Interfaz (React + Vite) del vectorizador "Traza".
Sube una imagen → el backend la convierte → descargas SVG + PNG transparente.

## Correr en local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy de `vite.config.js` manda `/api/*`
a `http://localhost:8000`, así que necesitas el backend corriendo en paralelo.

## Build de producción

```bash
VITE_API_BASE=https://TU-BACKEND.onrender.com npm run build
```

Genera `dist/`, listo para GitHub Pages / Vercel / Netlify / Cloudflare Pages.

## Despliegue en GitHub Pages

El sitio se publica en `https://catrehack.github.io/vectorize-web/`.

`vite.config.js` define `base: '/vectorize-web/'` para que las rutas de los
assets funcionen bajo ese subpath. Si lo montas en otro sitio, sobreescribe:

```bash
VITE_BASE=/otro-path/ VITE_API_BASE=https://api.ejemplo.com npm run build
```

### Workflow manual

```bash
npm install
VITE_API_BASE=https://vectorize-api.onrender.com npm run build
# copiar dist/ a la rama gh-pages (o a la carpeta docs/ de main)
```

## Variables de build

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE` | `/api` | URL base del backend FastAPI |
| `VITE_BASE` | `/vectorize-web/` | Subpath donde se publica el sitio |

## Estructura

- `src/App.jsx` — flujo completo: drag & drop, preview, convertir, 3 paneles de resultado, descargas.
- `src/App.css` — estilos (tema oscuro, acento lima).
- `src/main.jsx` — punto de entrada de React.

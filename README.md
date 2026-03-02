# FLTV scraper

futbol libre tv - node scraper

## Installation

```cmd
npm i @silent_m4gician/ftv-scraper
```

## Quick usage

```javascript
import { getData } from "@silent_m4gician/ftv-scraper"

const getMatches = async () => {
  const matches = await getData()
  console.log(matches)
}

getMatches()
```

## Use as backend/API JSON source

```javascript
import express from "express"
import { getAgendaSnapshot } from "@silent_m4gician/ftv-scraper"

const app = express()

app.get("/api/agenda", async (_req, res) => {
  const snapshot = await getAgendaSnapshot()
  res.json(snapshot)
})

app.listen(3000)
```

The endpoint response shape is:

```json
{
  "fetchedAt": "2026-01-12T18:21:10.456Z",
  "source": "https://tvlibree.com/",
  "items": [
    {
      "id": 1,
      "title": "PARTIDO ...",
      "iframe": "<iframe ...></iframe>"
    }
  ]
}
```

## Monitoring schedule changes

```javascript
import { getAgendaSnapshot, diffAgendaSnapshots } from "@silent_m4gician/ftv-scraper"

const previous = await getAgendaSnapshot()

// wait and run again later
const current = await getAgendaSnapshot()

const changes = diffAgendaSnapshots(previous, current)
console.log(changes.added)
console.log(changes.removed)
console.log(changes.changed)
```

## Included web demo (streaming-style UI)

This repository now includes a web page inspired by your reference design. It consumes `/api/agenda` and renders channel cards plus a modal player using the iframe from `getAgendaSnapshot()`.

Run it locally:

```cmd
npm run start:web
```

Then open:

```cmd
http://localhost:4173
```

## Screenshots

![cmd terminal](https://i.gyazo.com/7ce2cbdd79511875bd45df367b593aa4.png)
![FTV page](https://i.gyazo.com/5a3c7222dbf13fbf5badb31e19fca467.png)


## Solución para el error de Chromium/Playwright

Si el endpoint `/api/agenda` responde que falta el binario de Chromium, usa una de estas opciones:

### 1) Local o servidor con permisos de instalación

```cmd
npx playwright install chromium
```

También puedes usar el script incluido:

```cmd
npm run install:browsers
```

### 2) Entornos limitados (Vercel/Lambda/Cloud Functions)

- Instala navegadores durante build (no en runtime).
- Si ya tienes Chromium en el sistema, exporta la ruta:

```cmd
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium-browser npm run start:web
```

### 3) Qué hace ahora el backend demo

Para desarrollo local usa `npm run start:web` que levanta `scripts/dev-server.js` y sirve directamente `public/index.html`.


## Deploy en Vercel

Este repo ya incluye estructura compatible con Vercel:

- `public/` para los archivos estáticos (`index.html`, `app.js`, `styles.css`).
- `api/agenda.js` como serverless function para el endpoint `/api/agenda`.
- `vercel.json` con `outputDirectory: "public"`.

Si tu proyecto fallaba con `No Output Directory named "public" found`, este cambio lo corrige.


## Estructura recomendada para Vercel

Para que Vercel detecte rápido el `index.html`, este repo queda ordenado así:

- `public/index.html` (entrada web principal)
- `public/app.js` y `public/styles.css`
- `api/agenda.js` (endpoint serverless)
- `vercel.json` con `outputDirectory: "public"`

Con esto Vercel sirve la web desde `public/` de forma directa.

> Nota: si Playwright/Chromium falla en producción, `/api/agenda` responde en modo respaldo (`degraded: true`) con una lista cacheada o canales de emergencia para que la UI nunca quede vacía.


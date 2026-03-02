const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { getAgendaSnapshot } = require('../dist/index.js');

const PORT = process.env.PORT || 4173;
const root = __dirname;
const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

let installAttempted = false;

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  const type = mimeTypes[ext] || 'text/plain; charset=utf-8';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': type });
    res.end(content);
  });
}

function isMissingBrowserError(error) {
  if (!(error instanceof Error)) return false;
  return error.message.includes('Executable doesn\'t exist');
}

function attemptInstallChromium() {
  if (installAttempted) return;
  installAttempted = true;

  const result = spawnSync('npx', ['playwright', 'install', 'chromium'], {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  if (result.status !== 0) {
    console.error('Automatic Chromium installation failed.');
  }
}

async function buildAgendaResponse() {
  try {
    return await getAgendaSnapshot({ executablePath });
  } catch (error) {
    if (isMissingBrowserError(error)) {
      attemptInstallChromium();
      return getAgendaSnapshot({ executablePath });
    }

    throw error;
  }
}

const server = http.createServer(async (req, res) => {
  const url = req.url || '/';

  if (url === '/api/agenda') {
    try {
      const data = await buildAgendaResponse();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: 'No se pudo obtener la agenda en este momento',
        detail: error instanceof Error ? error.message : 'unknown',
        hint: 'Instala binarios con: npx playwright install chromium, o define PLAYWRIGHT_EXECUTABLE_PATH con un Chromium ya instalado.'
      }));
    }

    return;
  }

  const cleanPath = url === '/' ? '/index.html' : url;
  const finalPath = path.join(root, cleanPath);

  if (!finalPath.startsWith(root)) {
    res.writeHead(400);
    res.end('Bad request');
    return;
  }

  sendFile(res, finalPath);
});

server.listen(PORT, () => {
  console.log(`Web demo running at http://localhost:${PORT}`);
});

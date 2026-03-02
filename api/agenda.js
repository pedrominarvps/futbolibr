const fs = require('fs');
const path = require('path');
const { getAgendaSnapshot } = require('../dist/index.js');

const fallbackPath = path.join(__dirname, '..', 'data', 'agenda-fallback.json');

function readFallback() {
  try {
    const raw = fs.readFileSync(fallbackPath, 'utf8');
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed?.items)) {
      return parsed;
    }
  } catch (_error) {
    // ignore malformed/missing fallback
  }

  return {
    fetchedAt: new Date().toISOString(),
    source: 'fallback',
    items: [
      {
        id: 1,
        title: 'Canal de respaldo 1',
        iframe: '<iframe src="https://www.youtube.com/embed/jfKfPfyJRdk" allowfullscreen></iframe>'
      },
      {
        id: 2,
        title: 'Canal de respaldo 2',
        iframe: '<iframe src="https://www.youtube.com/embed/5qap5aO4i9A" allowfullscreen></iframe>'
      }
    ]
  };
}

function writeFallback(snapshot) {
  try {
    fs.mkdirSync(path.dirname(fallbackPath), { recursive: true });
    fs.writeFileSync(fallbackPath, JSON.stringify(snapshot, null, 2));
  } catch (_error) {
    // best effort cache only
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
    const data = await getAgendaSnapshot({ executablePath });

    writeFallback(data);
    res.statusCode = 200;
    res.end(JSON.stringify({ ...data, degraded: false }));
  } catch (error) {
    const fallback = readFallback();

    res.statusCode = 200;
    res.end(JSON.stringify({
      ...fallback,
      degraded: true,
      error: 'No se pudo obtener la agenda en vivo. Mostrando respaldo.',
      detail: error instanceof Error ? error.message : 'unknown',
      hint: 'Configura PLAYWRIGHT_EXECUTABLE_PATH o instala Chromium en el entorno.'
    }));
  }
};

const { getAgendaSnapshot } = require('../dist/index.js');

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
    const data = await getAgendaSnapshot({ executablePath });
    res.statusCode = 200;
    res.end(JSON.stringify(data));
  } catch (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({
      error: 'No se pudo obtener la agenda en este momento',
      detail: error instanceof Error ? error.message : 'unknown',
      hint: 'En Vercel configura PLAYWRIGHT_EXECUTABLE_PATH o instala Chromium durante build.'
    }));
  }
};

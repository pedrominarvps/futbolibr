const channelsEl = document.getElementById('channels');
const statusEl = document.getElementById('status');
const refreshBtn = document.getElementById('refreshBtn');
const modal = document.getElementById('playerModal');
const closeModalBtn = document.getElementById('closeModal');
const playerTitle = document.getElementById('playerTitle');
const playerFrame = document.getElementById('playerFrame');

function extractIframeSrc(iframeHtml) {
  if (!iframeHtml) return null;

  const doc = new DOMParser().parseFromString(iframeHtml, 'text/html');
  const iframe = doc.querySelector('iframe');
  return iframe?.src || null;
}

function createCard(item, fetchedAt) {
  const card = document.createElement('article');
  card.className = 'channel-card';

  const title = document.createElement('h3');
  title.textContent = item.title || `Canal #${item.id}`;

  const meta = document.createElement('div');
  meta.className = 'channel-meta';
  meta.textContent = `ID ${item.id} · actualizado ${new Date(fetchedAt).toLocaleTimeString()}`;

  const button = document.createElement('button');
  button.textContent = 'Ver canal';
  button.addEventListener('click', () => {
    const src = extractIframeSrc(item.iframe);

    if (!src) {
      statusEl.textContent = 'Este canal no tiene iframe disponible en este momento.';
      return;
    }

    playerTitle.textContent = item.title || `Canal #${item.id}`;
    playerFrame.innerHTML = `<iframe src="${src}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    modal.showModal();
  });

  card.append(title, meta, button);
  return card;
}

async function loadAgenda() {
  statusEl.textContent = 'Actualizando agenda…';
  refreshBtn.disabled = true;

  try {
    const response = await fetch('/api/agenda');

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    channelsEl.innerHTML = '';

    data.items.forEach((item) => {
      channelsEl.appendChild(createCard(item, data.fetchedAt));
    });

    statusEl.textContent = `${data.items.length} canales cargados · fuente ${data.source}`;
  } catch (error) {
    statusEl.textContent = `Error al cargar agenda: ${error instanceof Error ? error.message : 'desconocido'}`;
  } finally {
    refreshBtn.disabled = false;
  }
}

refreshBtn.addEventListener('click', loadAgenda);
closeModalBtn.addEventListener('click', () => {
  playerFrame.innerHTML = '';
  modal.close();
});

loadAgenda();

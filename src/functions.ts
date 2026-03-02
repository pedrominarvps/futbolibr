import { ChromiumBrowser, chromium } from "playwright";

interface Match {
  id: number;
  title: string;
  url: string;
}

export interface MatchEmbed {
  id: number;
  title: string;
  iframe: string;
}

export interface AgendaSnapshot {
  fetchedAt: string;
  source: string;
  items: MatchEmbed[];
}

export interface AgendaDiff {
  added: MatchEmbed[];
  removed: MatchEmbed[];
  changed: Array<{
    before: MatchEmbed;
    after: MatchEmbed;
  }>;
}

export interface ScraperOptions {
  executablePath?: string;
  headless?: boolean;
}

async function getMatches(browser: ChromiumBrowser): Promise<Match[]> {
  const page = await browser.newPage();

  try {
    await page.goto('https://www.pelotalibretv.com/agenda.html');
    await page.waitForSelector('div[id="wraper"]');

    const results: Match[] = await page.evaluate(() => {
      const matches: Match[] = [];
      const links: string[] = [];

      document.querySelectorAll<HTMLAnchorElement>('ul[class="menu"] li ul li a').forEach((a) => {
        links.push(a.href);
      });

      document.querySelectorAll<HTMLLIElement>('ul[class="menu"] li').forEach((li, index) => {
        if (!li.innerText.includes('0p')) {
          matches.push({
            id: index,
            title: li.innerText,
            url: links[index]
          });
        }
      });

      return matches;
    });

    return results;
  } finally {
    await page.close();
  }
}

interface UrlObject {
  url: string;
}

async function getLink(url: UrlObject, browser: ChromiumBrowser): Promise<string> {
  const page = await browser.newPage();

  try {
    if (url.url === undefined) {
      return 'no link yet';
    }

    await page.goto(url.url);
    await page.waitForSelector('div[class="container"]');

    const results: string = await page.evaluate(() => {
      const iframeElement = document.querySelector<HTMLIFrameElement>('div[class="embed-responsive embed-responsive-16by9"] iframe');
      return iframeElement ? iframeElement.outerHTML : '';
    });

    return results;
  } finally {
    await page.close();
  }
}

export async function getData(options: ScraperOptions = {}): Promise<MatchEmbed[]> {
  const browser = await chromium.launch({
    headless: options.headless ?? true,
    executablePath: options.executablePath
  });

  try {
    const matches = await getMatches(browser);
    const links: MatchEmbed[] = [];

    for await (const match of matches) {
      const contenido = await getLink(match, browser);

      links.push({
        id: match.id,
        title: match.title,
        iframe: contenido
      });
    }

    return links;
  } finally {
    await browser.close();
  }
}

/**
 * Backend/API helper: shape ready to return as JSON payload.
 */
export async function getAgendaSnapshot(options: ScraperOptions = {}): Promise<AgendaSnapshot> {
  const items = await getData(options);

  return {
    fetchedAt: new Date().toISOString(),
    source: 'https://www.pelotalibretv.com/agenda.html',
    items
  };
}

/**
 * Monitoring helper: compare two snapshots and return adds/removes/changes.
 */
export function diffAgendaSnapshots(previous: AgendaSnapshot, current: AgendaSnapshot): AgendaDiff {
  const previousById = new Map(previous.items.map((item) => [item.id, item]));
  const currentById = new Map(current.items.map((item) => [item.id, item]));

  const added: MatchEmbed[] = [];
  const removed: MatchEmbed[] = [];
  const changed: Array<{ before: MatchEmbed; after: MatchEmbed }> = [];

  for (const [id, currentItem] of currentById) {
    const previousItem = previousById.get(id);

    if (!previousItem) {
      added.push(currentItem);
      continue;
    }

    if (previousItem.title !== currentItem.title || previousItem.iframe !== currentItem.iframe) {
      changed.push({
        before: previousItem,
        after: currentItem
      });
    }
  }

  for (const [id, previousItem] of previousById) {
    if (!currentById.has(id)) {
      removed.push(previousItem);
    }
  }

  return {
    added,
    removed,
    changed
  };
}

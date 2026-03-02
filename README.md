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
  "source": "https://www.pelotalibretv.com/agenda.html",
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

## Screenshots

![cmd terminal](https://i.gyazo.com/7ce2cbdd79511875bd45df367b593aa4.png)
![FTV page](https://i.gyazo.com/5a3c7222dbf13fbf5badb31e19fca467.png)

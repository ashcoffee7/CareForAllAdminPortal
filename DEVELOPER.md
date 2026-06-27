# CareForAll Admin Backend Portal — Developer Handoff

Interactive front-end prototype of the CareForAll Super Admin command center.
Pure HTML/CSS/JS, **no build step, no backend** — all data is in-memory mock data.

## What's in this package

| Path | Use |
|---|---|
| `standalone.html` | The entire app in one self-contained file. Double-click to open in any browser. This is what's hosted at the public link. |
| `src/index.html` | Same app, split for development — markup only, links to the css/js below. |
| `src/styles.css` | All styles (extracted from the `<style>` block). |
| `src/app.js` | All logic: mock data, page renderers, the action dispatcher, role permissions. |
| `README.md` | Short overview. |

`standalone.html` and the `src/` version are functionally identical. Edit whichever
you prefer; to regenerate the standalone, inline `styles.css` into a `<style>` tag
and `app.js` into a `<script>` tag.

## Run it locally

No tooling needed. Either:

```bash
# option 1: just open the file
open standalone.html

# option 2: serve the split version (needed because it loads styles.css/app.js)
cd src && python3 -m http.server 4174
# then visit http://localhost:4174
```

## How the code is organized (`src/app.js`)

Top-to-bottom:

1. **Mock data** — `CHAPTERS`, `MEMBERS`, `SERVICE_HOURS`, `CERTIFICATES`,
   `MAPPING_TASKS`, `MAPATHONS`, `PROJECTS`, `MENTORS`, `MENTOR_SESSIONS`,
   `FORMS`, `EVENTS`, `EVENT_ATTENDANCE`, `RESOURCES`, `CHECKINS`, etc.
   Replace these arrays with real API calls to wire a backend.
2. **Helpers** — `badge()`, `table()`, `kpis()`, `downloadCSV()`, modal helpers,
   `openExt()`.
3. **Roles & permissions** — `ROLE_PERMS` defines each admin role's nav access and
   write permission; `canWrite()` gates every mutating button; the "View as"
   switcher calls `switchRole()`.
4. **Pages** — `PAGES.dashboard`, `PAGES.mapping`, `PAGES.projects`,
   `PAGES.mentorship`, `PAGES.chapters`, `PAGES.hours`, `PAGES.forms`,
   `PAGES.settings`. Each builds its HTML string and sets `#main`.
5. **Drawers / modals** — `reviewDrawer()` (service-hour review), `chapterDetail()`,
   `projDrawer()`, and the various edit modals (`resourceModal`, `taskModal`,
   `mentorModal`).
6. **Action dispatcher** — a single delegated click handler routes `data-act="…"`
   (and a few `data-*` attributes) to `act()`, which performs the real behavior
   (state change, modal, CSV download, email compose).

> **Wiring a real backend (Supabase + Vercel)?** See **[BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)** —
> full schema, the button→table→operation map, copy-paste Supabase wiring, role/RLS
> security, file uploads, email, Vercel deploy, and the Google-Form mentorship sync.

### To wire a real backend
- Swap the mock arrays for fetches to your API.
- Replace the in-place state mutations in `act()` / `decide()` / the modals with
  API writes, then re-render the affected `PAGES.*`.
- `ROLE_PERMS` maps cleanly onto server-side role checks — keep the same role keys.

## Design tokens
CSS variables live at the top of `styles.css` (`:root`): brand blue `#2f6bed`,
coral `#fb5a63`, navy sidebar gradient, Poppins for numbers/headings, Manrope for
body. Icons are Tabler (loaded from CDN); fonts from Google Fonts.

_Prototype only — all names, emails, and data are fictional._

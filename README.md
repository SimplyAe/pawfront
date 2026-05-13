# pawtoka-web

The official frontend for PawToka, a private osu! server based on bancho.py. Built with Next.js 15, React 19, and TypeScript. This repository is the sole frontend client for the PawToka server and is not intended as a general-purpose template.

**No assistance will be provided with setting up this frontend. It is documented here for reference only.**

---

## Stack

- **Framework** — Next.js 15 (App Router)
- **Language** — TypeScript
- **Styling** — CSS Modules / global CSS (no Tailwind in runtime styles)
- **Charting** — Recharts
- **BBCode** — @bbob/html + @bbob/preset-html5
- **Runtime** — Node.js, port 8888

---

## Pages

| Route | Description |
|---|---|
| `/` | Home page. Displays server statistics, a live player count, the top 10 leaderboard podium, recent scores, and a staff section. |
| `/u/[id]` | User profile. Shows player statistics, rank, grade counts, best and recent scores, most played maps, a playcount graph, a userpage bio with BBCode support, and a comments section. |
| `/b/[id]` | Beatmap detail page with leaderboard scores. |
| `/beatmaps` | Beatmap browser with search, status filter, and mode filter. |
| `/leaderboard` | Global leaderboard with mode/mods selector, sort options, and country filter. |
| `/top-plays` | Server-wide top PP plays. Displays the 100 highest-ranked scores (10 per page, 10 pages) across any selected mode, shown as banner cards with beatmap cover backgrounds. |
| `/clans` | Clan listing and individual clan pages. |
| `/login` | Authentication page. |
| `/register` | Registration page. |
| `/settings` | Account settings including avatar upload, banner upload, password change, and profile preferences. |
| `/staff` | Staff panel. Restricted to moderators and above. Includes user management, restriction tools, a score log, and server metrics. |
| `/reset-password` | Password reset flow. |

---

## API Routes (Next.js)

Internal API routes under `/api/` act as authenticated proxies between the frontend and the bancho backend. Session tokens are forwarded on the user's behalf.

| Route | Purpose |
|---|---|
| `/api/me` | Returns the current session's user identity. |
| `/api/userpage` | Proxies userpage bio update requests. |
| `/api/comments` | Proxies comment fetch, post, and delete requests. |
| `/api/banner/[id]` | Serves or proxies player banner images. |
| `/api/metrics` | Internal server metrics endpoint for the staff panel. |

---

## Features

### User Profiles

- Full statistics table per mode including PP, ranked score, total score, max combo, playcount, playtime, accuracy, total hits, replays watched, and registration date.
- Mode and mod selector (Vanilla, Relax, Autopilot across all game modes).
- Best scores and recent scores tabs.
- Most played maps tab.
- Userpage bio with BBCode rendering and an inline editor for the profile owner.
- Comments section with post and delete support. Deletion is available to the comment author, the profile owner, and staff.
- Playcount graph displaying monthly submitted score counts over the player's account lifetime, powered by a dedicated `play_activity` table in the database.
- Clan tag display with a link to the clan page.
- Online/offline status indicator with current activity.

### Top PP Plays

- Dedicated `/top-plays` page listing the 100 highest PP scores on the server.
- Paginated: 10 scores per page across 10 pages.
- Mode and mod selector refreshes the list without a page reload.
- Each entry is displayed as a banner card using the beatmap cover as the background, with an overlay gradient, grade, PP, accuracy, combo, miss count, hit distribution, player, and submission time.

### Play Activity Tracking

- A `play_activity` table records every score submission (passed and failed) with a precise timestamp, user ID, and mode.
- The table was backfilled from the existing `scores` table on creation.
- The `/get_player_activity` API endpoint returns monthly aggregated play counts for a given player and mode, used to render the profile playcount graph.

### Staff Panel

- User search with inline detail drawer.
- Restriction and unrestriction with reason logging.
- Score log with map context and player links.
- Server metrics dashboard.

---

## Project Structure

```
src/
  app/
    (pages)/          Next.js App Router pages
    api/              Internal authenticated API proxy routes
    globals.css       Global stylesheet
  components/
    Header.tsx        Site navigation
    Footer.tsx        Site footer
    Flag.tsx          Country flag component
    GradeImage.tsx    osu! grade letter image renderer
    ModeSelector.tsx  Mode and mods tab selector
  lib/
    api.ts            Typed API client for the bancho backend
    session.ts        Session read/write utilities
    utils.ts          Shared helpers (formatters, parsers, colour maps)
```

---

## Backend Dependency

This frontend requires the PawToka bancho.py backend to be running and reachable at `https://api.pawinput.xyz/v1`. All player data, score data, leaderboard data, and authentication are served exclusively by that backend. The frontend will not function without it.

The following custom endpoints were added to the backend for this frontend:

- `GET /get_top_scores` — Top PP scores server-wide, paginated by mode.
- `POST /update_userpage` — Updates a player's BBCode bio.
- `GET /get_user_comments` — Fetches comments on a player's profile.
- `POST /add_comment` — Posts a new comment.
- `DELETE /delete_comment` — Deletes a comment by ID.
- `GET /get_player_activity` — Returns monthly play counts from `play_activity`.

---

## License

This project is proprietary. It is published for transparency and is not licensed for reuse, redistribution, or modification by third parties.

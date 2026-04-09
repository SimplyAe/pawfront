# pawtoka-web

Frontend for PawToka, a private osu! server. Built with Next.js 15, React 19, TypeScript, Tailwind CSS, and Lucide icons. Runs on port 8888.

## Pages

- `/` — Home page with server stats and recent scores
- `/u/[id]` — User profile with scores, stats, and mode selector
- `/b/[id]` — Beatmap page
- `/beatmaps` — Beatmap listing
- `/leaderboard` — Global leaderboard
- `/login` — Login
- `/register` — Registration
- `/settings` — Account settings
- `/staff` — Staff panel (restricted)

## Structure

```
src/
  app/        Next.js app router pages and API routes
  components/ Shared UI components (Header, Footer, GradeImage, ModeSelector)
  lib/        API client, session handling, utilities
```

## Notes

This frontend is built exclusively for the PawToka osu! private server and is not intended for general use. It communicates with the PawToka bancho backend and expects the server's API to be available.
